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
import { useQuery } from '@tanstack/react-query'
import { Copy, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserModels } from '@/lib/api'
import { copyToClipboard } from '@/lib/copy-to-clipboard'

function getServerAddress(): string {
  try {
    const raw = localStorage.getItem('status')
    if (raw) {
      const status = JSON.parse(raw) as { server_address?: string }
      if (status.server_address) return status.server_address
    }
  } catch {
    /* empty */
  }

  return window.location.origin
}

function maskKey(key: string): string {
  if (!key) return '••••••••'
  if (key.startsWith('sk-')) return key.slice(0, 8) + '••••' + key.slice(-4)
  return key.slice(0, 4) + '••••' + key.slice(-4)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenKey: string
}

export function ApiConfigDialog(props: Props) {
  const { t } = useTranslation()
  const serverAddress = getServerAddress()
  const apiAddress = serverAddress + '/v1'
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['user-models-api-config'],
    queryFn: getUserModels,
    enabled: props.open,
    staleTime: 5 * 60 * 1000,
  })
  const models = modelsData?.data ?? []

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      toast.success(t('Copied'))
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('API Config')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950'>
            <Info className='mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400' />
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              {t('Please select OpenAI compatible mode in your client')}
            </p>
          </div>

          <div className='space-y-1.5'>
            <label className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
              {t('API Address')}
            </label>
            <div className='flex items-center gap-2'>
              <code className='bg-muted flex-1 truncate rounded px-3 py-2 font-mono text-sm'>
                {apiAddress}
              </code>
              <Button
                variant='outline'
                size='icon'
                onClick={() => handleCopy(apiAddress)}
              >
                <Copy className='size-4' />
              </Button>
            </div>
          </div>

          <div className='space-y-1.5'>
            <label className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
              {t('API Key')}
            </label>
            <div className='flex items-center gap-2'>
              <code className='bg-muted flex-1 truncate rounded px-3 py-2 font-mono text-sm'>
                {maskKey(props.tokenKey)}
              </code>
              <Button
                variant='outline'
                size='icon'
                onClick={() => handleCopy(props.tokenKey)}
              >
                <Copy className='size-4' />
              </Button>
            </div>
          </div>

          <div className='space-y-1.5'>
            <label className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
              {t('Available Models')}
            </label>
            <div className='bg-muted max-h-48 space-y-1 overflow-y-auto rounded p-2'>
              {modelsLoading ? (
                <div className='space-y-2 p-1'>
                  <Skeleton className='h-8 w-full' />
                  <Skeleton className='h-8 w-full' />
                  <Skeleton className='h-8 w-3/4' />
                </div>
              ) : models.length === 0 ? (
                <p className='text-muted-foreground p-2 text-center text-sm'>
                  {t('No models available')}
                </p>
              ) : (
                models.map((model) => (
                  <div key={model} className='flex items-center gap-2'>
                    <code className='flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-sm'>
                      {model}
                    </code>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='shrink-0'
                      onClick={() => handleCopy(model)}
                    >
                      <Copy className='size-3.5' />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
