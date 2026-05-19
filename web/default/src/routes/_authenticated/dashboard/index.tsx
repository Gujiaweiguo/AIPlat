/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import { DASHBOARD_DEFAULT_SECTION } from '@/features/dashboard/section-registry'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    const userRole = auth.user?.role ?? 0
    const isAdmin = userRole >= ROLE.ADMIN
    const defaultSection = isAdmin ? DASHBOARD_DEFAULT_SECTION : 'models'
    throw redirect({
      to: '/dashboard/$section',
      params: { section: defaultSection },
    })
  },
})
