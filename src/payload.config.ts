// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, PayloadRequest, type EmailAdapter } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { AcademicLevels } from './collections/AcademicLevels'
import { Subjects } from './collections/Subjects'
import { ExamPapers } from './collections/ExamPapers'
import { MCQuestions } from './collections/MCQuestions'
import { Videos } from './collections/Videos'
import { Books } from './collections/Books'
import { Subscriptions } from './collections/Subscriptions'
import { StudyPlans } from './collections/StudyPlans'
import { Categories } from './collections/Category'
import { Transactions } from './collections/Transactions'
import { PaymentSettlements } from './collections/PaymentSettlements'
import { Topics } from './collections/Topics'
import { UserProgress } from './collections/UserProgress'
import { TestResults } from './collections/TestResults'
import { TestSessions } from './collections/TestSessions'
import { ContentAccess } from './collections/ContentAccess'
import { Notifications } from './collections/Notifications'
import { ActivityLogs } from './collections/ActivityLogs'
import { ReferralAttributions } from './collections/ReferralAttributions'
import { ReferralRewards } from './collections/ReferralRewards'
import { Settings } from './Settings/config'
import { plugins } from './plugins'
import { canRunAdministrativeJob } from './utilities/requestAuthorization'
import { backfillLegacyEmailVerification } from './utilities/emailVerification'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const testEmailAdapter: EmailAdapter<{ id: string }> = () => ({
  defaultFromAddress: 'test@smartvision.invalid',
  defaultFromName: 'Smart Vision Test',
  name: 'smartvision-test-email',
  sendEmail: async () => ({ id: 'test-email-not-sent' }),
})

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    routes: {},
    components: {
      beforeDashboard: ['@/components/BeforeAdminDashboard'],
      graphics: {
        Icon: '@/components/Graphics/Icon/Icon#Icon',
        Logo: '@/components/Graphics/Logo/Logo#Logo',
      },
    },
    meta: {
      titleSuffix: ' - Smart Vision',
      title: 'Smart Vision',
      icons: [
        {
          url: `${process.env.NEXT_PUBLIC_SERVER_URL}/favicon.png`,
        },
      ],
    },
  },
  collections: [
    Users,
    AcademicLevels,
    Subjects,
    ExamPapers,
    MCQuestions,
    Videos,
    Books,
    Subscriptions,
    Media,
    StudyPlans,
    Categories,
    Transactions,
    PaymentSettlements,
    Topics,
    UserProgress,
    TestSessions,
    TestResults,
    ContentAccess,
    Notifications,
    ActivityLogs,
    ReferralAttributions,
    ReferralRewards,
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  email:
    process.env.NODE_ENV === 'test'
      ? testEmailAdapter
      : resendAdapter({
          defaultFromAddress: 'admin@smartvisioncm.com',
          defaultFromName: 'Smart Vision Cameroon',
          apiKey: process.env.RESEND_API_KEY || '',
        }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    ...plugins,
    // storage-adapter-placeholder
  ],
  onInit: async (payload) => {
    const verifiedLegacyUsers = await backfillLegacyEmailVerification(payload)
    if (verifiedLegacyUsers > 0) {
      payload.logger.info(`Marked ${verifiedLegacyUsers} existing user accounts as email verified`)
    }
    payload.logger.info('Payload initialized successfully')
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        return canRunAdministrativeJob(
          req.user,
          req.headers.get('authorization'),
          process.env.CRON_SECRET,
        )
      },
    },
    tasks: [],
    workflows: [],
  },
  upload: {
    limits: {
      fileSize: 2147483648, // 2GB
    },
  },
})
