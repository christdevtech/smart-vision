// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
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
import { Topics } from './collections/Topics'
import { UserProgress } from './collections/UserProgress'
import { TestResults } from './collections/TestResults'
import { ContentAccess } from './collections/ContentAccess'
import { Notifications } from './collections/Notifications'
import { ActivityLogs } from './collections/ActivityLogs'
import { Settings } from './Settings/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    routes: {},
    components: {
      beforeDashboard: ['@/components/BeforeAdminDashboard'],
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
    Topics,
    UserProgress,
    TestResults,
    ContentAccess,
    Notifications,
    ActivityLogs,
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
  email: nodemailerAdapter({
    defaultFromAddress: `${process.env.SMTP_FROM}`,
    defaultFromName: `${process.env.SMTP_FROM_NAME}`,
    // Nodemailer transportOptions
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  onInit: async (payload) => {
    payload.logger.info('Payload initialized successfully')
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
    workflows: [],
  },
})
