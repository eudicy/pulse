'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

const emailLinkSchema = z.object({
  emailLink: z.string().email('Please enter a valid email'),
})

type EmailLinkValues = z.infer<typeof emailLinkSchema>

export default function LoginPage() {
  const [credError, setCredError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [emailLinkError, setEmailLinkError] = useState<string | null>(null)

  const credForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const emailForm = useForm<EmailLinkValues>({
    resolver: zodResolver(emailLinkSchema),
    defaultValues: { emailLink: '' },
  })

  async function onCredentialsSubmit(values: LoginValues) {
    setCredError(null)
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirectTo: '/app/dashboard',
    })
    if (result?.error) {
      setCredError('Invalid email or password.')
    }
  }

  async function onEmailLinkSubmit(values: EmailLinkValues) {
    setEmailLinkError(null)
    const result = await signIn('nodemailer', {
      email: values.emailLink,
      redirect: false,
    })
    if (result?.error) {
      setEmailLinkError('Failed to send sign-in link. Please try again.')
    } else {
      setEmailSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in with password</CardTitle>
            <CardDescription>
              Enter your email and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...credForm}>
              <form
                onSubmit={credForm.handleSubmit(onCredentialsSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={credForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={credForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {credError && (
                  <p className="text-sm text-destructive">{credError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={credForm.formState.isSubmitting}
                >
                  {credForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign in with email link</CardTitle>
            <CardDescription>
              We&apos;ll send a magic link to your inbox
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <p className="text-sm text-muted-foreground">
                Check your email for a sign-in link.
              </p>
            ) : (
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onEmailLinkSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={emailForm.control}
                    name="emailLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {emailLinkError && (
                    <p className="text-sm text-destructive">{emailLinkError}</p>
                  )}
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={emailForm.formState.isSubmitting}
                  >
                    {emailForm.formState.isSubmitting
                      ? 'Sending…'
                      : 'Send sign-in link'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
