package model

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func makeUser(username string, role int, group string) *User {
	return &User{
		Username:    username,
		Password:    "Password123",
		DisplayName: username,
		Role:        role,
		Status:      common.UserStatusEnabled,
		Email:       username + "@example.com",
		Group:       group,
	}
}

func makeToken(userID int, key string) *Token {
	return &Token{
		UserId:      userID,
		Key:         key,
		Status:      common.TokenStatusEnabled,
		Name:        key,
		RemainQuota: 100,
		Group:       "default",
	}
}

func makeChannel(name, group, models string, priority int64, weight uint) *Channel {
	return &Channel{
		Name:     name,
		Key:      name + "-key",
		Status:   common.ChannelStatusEnabled,
		Group:    group,
		Models:   models,
		Priority: &priority,
		Weight:   &weight,
	}
}

func TestUserInsertAndGetUserById(t *testing.T) {
	setupTestDB(t)
	user := makeUser("alice", common.RoleCommonUser, "team-a")
	require.NoError(t, user.Insert(0))

	loaded, err := GetUserById(user.Id, true)
	require.NoError(t, err)
	assert.Equal(t, "alice", loaded.Username)
	assert.NotEmpty(t, loaded.Password)
	assert.NotEqual(t, "Password123", loaded.Password)
}

func TestUserValidateAndFillByUsername(t *testing.T) {
	setupTestDB(t)
	user := makeUser("bob", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))

	login := &User{Username: "bob", Password: "Password123"}
	require.NoError(t, login.ValidateAndFill())
	assert.Equal(t, user.Id, login.Id)
}

func TestUserValidateAndFillByEmail(t *testing.T) {
	setupTestDB(t)
	user := makeUser("carol", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))

	login := &User{Username: user.Email, Password: "Password123"}
	require.NoError(t, login.ValidateAndFill())
	assert.Equal(t, "carol", login.Username)
}

func TestUserUpdateHashesPassword(t *testing.T) {
	setupTestDB(t)
	user := makeUser("dave", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))

	user.Password = "NewPassword123"
	user.DisplayName = "Dave Updated"
	require.NoError(t, user.Update(true))

	loaded, err := GetUserById(user.Id, true)
	require.NoError(t, err)
	assert.Equal(t, "Dave Updated", loaded.DisplayName)
	assert.True(t, common.ValidatePasswordAndHash("NewPassword123", loaded.Password))
}

func TestDeleteUserByIdSoftDelete(t *testing.T) {
	setupTestDB(t)
	user := makeUser("erin", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))

	require.NoError(t, DeleteUserById(user.Id))
	_, err := GetUserById(user.Id, true)
	require.Error(t, err)
	assert.ErrorIs(t, err, gorm.ErrRecordNotFound)
}

func TestSearchUsersByGroup(t *testing.T) {
	setupTestDB(t)
	users := []*User{
		makeUser("frank", common.RoleCommonUser, "team-a"),
		makeUser("grace", common.RoleCommonUser, "team-a"),
		makeUser("heidi", common.RoleCommonUser, "team-b"),
	}
	for _, user := range users {
		require.NoError(t, user.Insert(0))
	}

	result, total, err := SearchUsers("gr", "team-a", 0, 10)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, result, 1)
	assert.Equal(t, "grace", result[0].Username)
}

func TestCheckUserExistOrDeletedAfterSoftDelete(t *testing.T) {
	setupTestDB(t)
	user := makeUser("ivan", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	require.NoError(t, user.Delete())

	exists, err := CheckUserExistOrDeleted("ivan", user.Email)
	require.NoError(t, err)
	assert.True(t, exists)
}

func TestRootUserExists(t *testing.T) {
	setupTestDB(t)
	assert.False(t, RootUserExists())
	root := makeUser("rooty", common.RoleRootUser, "default")
	require.NoError(t, root.Insert(0))
	assert.True(t, RootUserExists())
}

func TestTokenInsertAndGetByKey(t *testing.T) {
	setupTestDB(t)
	user := makeUser("jack", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-1")
	require.NoError(t, token.Insert())

	loaded, err := GetTokenByKey("token-key-1", true)
	require.NoError(t, err)
	assert.Equal(t, token.Id, loaded.Id)
}

func TestTokenUpdatePersistsFields(t *testing.T) {
	setupTestDB(t)
	user := makeUser("kate", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-2")
	require.NoError(t, token.Insert())

	token.Name = "renamed"
	token.RemainQuota = 55
	token.Group = "vip"
	require.NoError(t, token.Update())

	loaded, err := GetTokenById(token.Id)
	require.NoError(t, err)
	assert.Equal(t, "renamed", loaded.Name)
	assert.Equal(t, 55, loaded.RemainQuota)
	assert.Equal(t, "vip", loaded.Group)
}

func TestTokenSelectUpdateStatus(t *testing.T) {
	setupTestDB(t)
	user := makeUser("leo", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-3")
	require.NoError(t, token.Insert())

	token.Status = common.TokenStatusExpired
	token.AccessedTime = 12345
	require.NoError(t, token.SelectUpdate())

	loaded, err := GetTokenById(token.Id)
	require.NoError(t, err)
	assert.Equal(t, common.TokenStatusExpired, loaded.Status)
	assert.EqualValues(t, 12345, loaded.AccessedTime)
}

func TestIncreaseTokenQuota(t *testing.T) {
	setupTestDB(t)
	user := makeUser("maya", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-4")
	require.NoError(t, token.Insert())

	require.NoError(t, IncreaseTokenQuota(token.Id, token.Key, 30))
	loaded, err := GetTokenById(token.Id)
	require.NoError(t, err)
	assert.Equal(t, 130, loaded.RemainQuota)
	assert.Equal(t, -30, loaded.UsedQuota)
}

func TestDecreaseTokenQuota(t *testing.T) {
	setupTestDB(t)
	user := makeUser("nick", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-5")
	require.NoError(t, token.Insert())

	require.NoError(t, DecreaseTokenQuota(token.Id, token.Key, 40))
	loaded, err := GetTokenById(token.Id)
	require.NoError(t, err)
	assert.Equal(t, 60, loaded.RemainQuota)
	assert.Equal(t, 40, loaded.UsedQuota)
}

func TestDeleteTokenById(t *testing.T) {
	setupTestDB(t)
	user := makeUser("olivia", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-6")
	require.NoError(t, token.Insert())

	require.NoError(t, DeleteTokenById(token.Id, user.Id))
	_, err := GetTokenById(token.Id)
	assert.Error(t, err)
}

func TestValidateUserTokenExpired(t *testing.T) {
	setupTestDB(t)
	user := makeUser("paul", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	token := makeToken(user.Id, "token-key-7")
	token.ExpiredTime = common.GetTimestamp() - 1
	require.NoError(t, token.Insert())

	loaded, err := ValidateUserToken(token.Key)
	require.ErrorIs(t, err, ErrTokenInvalid)
	require.NotNil(t, loaded)
	assert.Equal(t, common.TokenStatusExpired, loaded.Status)
}

func TestSearchUserTokens(t *testing.T) {
	setupTestDB(t)
	user := makeUser("queen", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	require.NoError(t, makeToken(user.Id, "alpha-key").Insert())
	beta := makeToken(user.Id, "beta-key")
	beta.Name = "beta-token"
	require.NoError(t, beta.Insert())

	tokens, total, err := SearchUserTokens(user.Id, "%beta%", "%beta%", 0, 10)
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, tokens, 1)
	assert.Equal(t, "beta-token", tokens[0].Name)
}

func TestChannelInsertCreatesAbilities(t *testing.T) {
	setupTestDB(t)
	channel := makeChannel("channel-a", "default,vip", "gpt-4o,gpt-4.1", 10, 3)
	require.NoError(t, channel.Insert())

	var count int64
	require.NoError(t, DB.Model(&Ability{}).Where("channel_id = ?", channel.Id).Count(&count).Error)
	assert.EqualValues(t, 4, count)
}

func TestGetChannelById(t *testing.T) {
	setupTestDB(t)
	channel := makeChannel("channel-b", "default", "gpt-4o", 10, 3)
	require.NoError(t, channel.Insert())

	loaded, err := GetChannelById(channel.Id, true)
	require.NoError(t, err)
	assert.Equal(t, channel.Name, loaded.Name)
}

func TestChannelUpdateRefreshesAbilities(t *testing.T) {
	setupTestDB(t)
	channel := makeChannel("channel-c", "default", "gpt-4o", 10, 3)
	require.NoError(t, channel.Insert())

	channel.Models = "gpt-4.1"
	channel.Group = "vip"
	require.NoError(t, channel.Update())

	models := GetGroupEnabledModels("vip")
	assert.Equal(t, []string{"gpt-4.1"}, models)
	assert.Empty(t, GetGroupEnabledModels("default"))
}

func TestDeleteChannelRemovesAbilities(t *testing.T) {
	setupTestDB(t)
	channel := makeChannel("channel-d", "default", "gpt-4o", 10, 3)
	require.NoError(t, channel.Insert())

	require.NoError(t, channel.Delete())
	var count int64
	require.NoError(t, DB.Model(&Ability{}).Where("channel_id = ?", channel.Id).Count(&count).Error)
	assert.Zero(t, count)
}

func TestNormalizeChannelGroupFilter(t *testing.T) {
	setupTestDB(t)
	assert.Equal(t, "", NormalizeChannelGroupFilter(" all "))
	assert.Equal(t, "vip", NormalizeChannelGroupFilter(" vip "))
}

func TestApplyChannelGroupFilter(t *testing.T) {
	setupTestDB(t)
	require.NoError(t, makeChannel("channel-e", "default,vip", "gpt-4o", 10, 1).Insert())
	require.NoError(t, makeChannel("channel-f", "team-b", "gpt-4o", 10, 1).Insert())

	var channels []Channel
	require.NoError(t, ApplyChannelGroupFilter(DB.Model(&Channel{}), "vip").Find(&channels).Error)
	require.Len(t, channels, 1)
	assert.Equal(t, "channel-e", channels[0].Name)
}

func TestNewChannelSortOptions(t *testing.T) {
	setupTestDB(t)
	require.NoError(t, makeChannel("zeta", "default", "gpt-4o", 1, 1).Insert())
	require.NoError(t, makeChannel("alpha", "default", "gpt-4o", 1, 1).Insert())

	channels, err := GetAllChannels(0, 10, false, false, NewChannelSortOptions("name", "asc", false))
	require.NoError(t, err)
	require.Len(t, channels, 2)
	assert.Equal(t, "alpha", channels[0].Name)
}

func TestSearchChannelsByGroupAndModel(t *testing.T) {
	setupTestDB(t)
	require.NoError(t, makeChannel("team-default", "default", "gpt-4o", 1, 1).Insert())
	require.NoError(t, makeChannel("team-vip", "vip", "claude-3-5", 1, 1).Insert())

	channels, err := SearchChannels("team", "vip", "claude", false)
	require.NoError(t, err)
	require.Len(t, channels, 1)
	assert.Equal(t, "team-vip", channels[0].Name)
}

func TestGetAllEnableAbilities(t *testing.T) {
	setupTestDB(t)
	channel := makeChannel("channel-g", "default", "gpt-4o", 10, 1)
	require.NoError(t, channel.Insert())

	abilities := GetAllEnableAbilities()
	require.Len(t, abilities, 1)
	assert.Equal(t, channel.Id, abilities[0].ChannelId)
}

func TestGetEnabledModels(t *testing.T) {
	setupTestDB(t)
	require.NoError(t, makeChannel("channel-h", "default", "gpt-4o,gpt-4.1", 10, 1).Insert())

	models := GetEnabledModels()
	assert.ElementsMatch(t, []string{"gpt-4o", "gpt-4.1"}, models)
}

func TestGetGroupEnabledModels(t *testing.T) {
	setupTestDB(t)
	require.NoError(t, makeChannel("channel-i", "vip", "gpt-4o", 10, 1).Insert())
	require.NoError(t, makeChannel("channel-j", "default", "claude-3-5", 10, 1).Insert())

	assert.Equal(t, []string{"gpt-4o"}, GetGroupEnabledModels("vip"))
}

func TestGetChannelSelectsEnabled(t *testing.T) {
	setupTestDB(t)
	priorityLow := int64(1)
	priorityHigh := int64(10)
	require.NoError(t, makeChannel("channel-low", "default", "gpt-4o", priorityLow, 1).Insert())
	require.NoError(t, makeChannel("channel-high", "default", "gpt-4o", priorityHigh, 1).Insert())

	channel, err := GetChannel("default", "gpt-4o", 0)
	require.NoError(t, err)
	require.NotNil(t, channel)
	assert.Equal(t, int64(10), channel.GetPriority())
}

func TestUpdateOptionAndAllOption(t *testing.T) {
	setupTestDB(t)
	InitOptionMap()
	require.NoError(t, UpdateOption("SystemName", "Integration Test"))

	options, err := AllOption()
	require.NoError(t, err)
	require.Len(t, options, 1)
	assert.Equal(t, "Integration Test", options[0].Value)
	assert.Equal(t, "Integration Test", common.OptionMap["SystemName"])
}

func TestInitOptionMapLoadsDatabaseOverride(t *testing.T) {
	setupTestDB(t)
	require.NoError(t, DB.Create(&Option{Key: "Footer", Value: "footer-from-db"}).Error)

	InitOptionMap()
	assert.Equal(t, "footer-from-db", common.OptionMap["Footer"])
}

func TestRecordLogAndGetAllLogs(t *testing.T) {
	setupTestDB(t)
	user := makeUser("rachel", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	RecordLog(user.Id, LogTypeManage, "updated settings")

	logs, total, err := GetAllLogs(LogTypeManage, 0, 0, "", "rachel", "", 0, 10, 0, "", "", "")
	require.NoError(t, err)
	assert.EqualValues(t, 1, total)
	require.Len(t, logs, 1)
	assert.Equal(t, "updated settings", logs[0].Content)
}

func TestRecordConsumeLogAndSumUsedQuota(t *testing.T) {
	setupTestDB(t)
	user := makeUser("sam", common.RoleCommonUser, "default")
	require.NoError(t, user.Insert(0))
	channel := makeChannel("channel-k", "default", "gpt-4o", 10, 1)
	require.NoError(t, channel.Insert())
	token := makeToken(user.Id, "token-key-8")
	token.Name = "quota-token"
	require.NoError(t, token.Insert())

	g := gin.New()
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/", nil)
	c.Set("username", user.Username)
	c.Set(common.RequestIdKey, "req-1")
	c.Set(common.UpstreamRequestIdKey, "up-1")
	_ = g

	RecordConsumeLog(c, user.Id, RecordConsumeLogParams{
		ChannelId:        channel.Id,
		PromptTokens:     10,
		CompletionTokens: 20,
		ModelName:        "gpt-4o",
		TokenName:        token.Name,
		Quota:            30,
		Content:          "consume",
		TokenId:          token.Id,
		UseTimeSeconds:   2,
		Group:            "default",
	})

	stat, err := SumUsedQuota(LogTypeConsume, time.Now().Add(-time.Hour).Unix(), time.Now().Add(time.Hour).Unix(), "gpt-4o", "sam", token.Name, channel.Id, "default")
	require.NoError(t, err)
	assert.Equal(t, 30, stat.Quota)
	assert.Equal(t, 1, stat.Rpm)
	assert.Equal(t, 30, stat.Tpm)
}
