import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '../sign-in-form'
import { signIn } from '@/lib/auth-client'

// Mock the auth client
jest.mock('@/lib/auth-client')
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// Mock router and search params
const mockPush = jest.fn()
const mockGet = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}))

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignIn.email = jest.fn()
    mockGet.mockReturnValue(null)
  })

  it('renders all form fields', () => {
    render(<SignInForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    mockSignIn.email.mockResolvedValue({ data: { user: { id: '1' } } })
    
    render(<SignInForm />)
    
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn.email).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        rememberMe: false,
      })
    })
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('handles remember me checkbox', async () => {
    const user = userEvent.setup()
    mockSignIn.email.mockResolvedValue({ data: { user: { id: '1' } } })
    
    render(<SignInForm />)
    
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByLabelText(/remember me/i))
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn.email).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        rememberMe: true,
      })
    })
  })

  it('redirects to callback URL when provided', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue('/protected-page')
    mockSignIn.email.mockResolvedValue({ data: { user: { id: '1' } } })
    
    render(<SignInForm />)
    
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/protected-page')
    })
  })

  it('shows error message on sign in failure', async () => {
    const user = userEvent.setup()
    mockSignIn.email.mockResolvedValue({ 
      error: { message: 'Invalid credentials' } 
    })
    
    render(<SignInForm />)
    
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    const toggleButton = screen.getByRole('button', { name: '' })
    await user.click(toggleButton)
    
    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})