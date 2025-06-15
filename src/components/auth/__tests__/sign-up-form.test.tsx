import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '../sign-up-form'
import { signUp } from '@/lib/auth-client'

// Mock the auth client
jest.mock('@/lib/auth-client')
const mockSignUp = signUp as jest.MockedFunction<typeof signUp>

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignUp.email = jest.fn()
  })

  it('renders all form fields', () => {
    render(<SignUpForm />)
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows password strength indicator', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('Password')
    await user.type(passwordInput, 'weakpass')
    
    expect(screen.getByText('Weak')).toBeInTheDocument()
    
    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPassword123!')
    
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument()
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('Password')
    await user.type(passwordInput, 'weak')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('validates password confirmation match', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('Password')
    const confirmInput = screen.getByLabelText(/confirm password/i)
    
    await user.type(passwordInput, 'StrongPassword123!')
    await user.type(confirmInput, 'DifferentPassword123!')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockSignUp.email.mockResolvedValue({ data: { user: { id: '1' } } })
    
    render(<SignUpForm />)
    
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPassword123!')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUp.email).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'StrongPassword123!',
        name: 'John Doe',
      })
    })
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows error message on sign up failure', async () => {
    const user = userEvent.setup()
    mockSignUp.email.mockResolvedValue({ 
      error: { message: 'Email already exists' } 
    })
    
    render(<SignUpForm />)
    
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPassword123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPassword123!')
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(await screen.findByText('Email already exists')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    const toggleButton = screen.getAllByRole('button')[0] // First toggle button
    await user.click(toggleButton)
    
    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})