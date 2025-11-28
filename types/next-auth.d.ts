import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'user' | 'accounting' | 'admin'
      departmentId: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'user' | 'accounting' | 'admin'
    departmentId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    role: 'user' | 'accounting' | 'admin'
    departmentId: string
  }
}
