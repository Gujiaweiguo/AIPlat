package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	t.Helper()
	var err error

	openedNewDB := false
	if DB == nil {
		db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
		if err != nil {
			t.Fatalf("failed to open test DB: %v", err)
		}
		sqlDB, err := db.DB()
		if err != nil {
			t.Fatalf("failed to get sql DB: %v", err)
		}
		sqlDB.SetMaxOpenConns(1)
		DB = db
		LOG_DB = db
		openedNewDB = true
		t.Cleanup(func() {
			_ = sqlDB.Close()
		})
	}

	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.LogSqlType = common.DatabaseTypeSQLite
	common.RedisEnabled = false
	common.BatchUpdateEnabled = false
	common.MemoryCacheEnabled = false
	common.LogConsumeEnabled = true
	common.DataExportEnabled = false
	common.IsMasterNode = true
	initCol()

	err = DB.AutoMigrate(
		&Channel{},
		&Token{},
		&User{},
		&Option{},
		&Ability{},
		&Log{},
		&Task{},
		&Redemption{},
		&TopUp{},
		&QuotaData{},
		&Setup{},
	)
	if err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	tables := []string{
		"abilities",
		"channels",
		"logs",
		"options",
		"quota_data",
		"redemptions",
		"setups",
		"tasks",
		"tokens",
		"top_ups",
		"users",
	}
	for _, table := range tables {
		requireNoDBError(t, DB.Exec("DELETE FROM "+table).Error)
	}
	t.Cleanup(func() {
		for _, table := range tables {
			_ = DB.Exec("DELETE FROM " + table).Error
		}
	})

	if openedNewDB {
		t.Cleanup(func() {
			DB = nil
			LOG_DB = nil
		})
	}
}

func requireNoDBError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatalf("database setup failed: %v", err)
	}
}
