import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../file-upload'
import { uploadMultipleFiles, validateFileClient } from '@/lib/file-upload'

// Mock the file upload functions
jest.mock('@/lib/file-upload')
const mockUploadMultipleFiles = uploadMultipleFiles as jest.MockedFunction<typeof uploadMultipleFiles>
const mockValidateFileClient = validateFileClient as jest.MockedFunction<typeof validateFileClient>

describe('FileUpload', () => {
  const mockOptions = { chatId: 'test-chat-id' }
  const mockOnFilesUploaded = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockValidateFileClient.mockReturnValue({ valid: true })
    mockUploadMultipleFiles.mockResolvedValue([
      {
        success: true,
        file: {
          id: '1',
          filename: 'test.txt',
          url: 'https://example.com/test.txt',
          contentType: 'text/plain',
          size: 1024,
          uploadedAt: new Date().toISOString(),
        },
      },
    ])
  })

  it('renders upload area', () => {
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    expect(screen.getByText(/drop files here or click to browse/i)).toBeInTheDocument()
    expect(screen.getByText(/max 50mb per file/i)).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    const user = userEvent.setup()
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, file)
    
    expect(screen.getByText('hello.txt')).toBeInTheDocument()
    expect(screen.getByText('1024 bytes')).toBeInTheDocument()
  })

  it('validates files on selection', async () => {
    const user = userEvent.setup()
    mockValidateFileClient.mockReturnValue({ 
      valid: false, 
      error: 'File too large' 
    })
    
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, file)
    
    expect(mockOnError).toHaveBeenCalledWith('hello.txt: File too large')
  })

  it('handles drag and drop', async () => {
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    const dropArea = screen.getByText(/drop files here or click to browse/i).closest('div')
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    
    fireEvent.dragOver(dropArea!)
    expect(dropArea).toHaveClass('border-blue-500')
    
    fireEvent.drop(dropArea!, {
      dataTransfer: {
        files: [file],
      },
    })
    
    await waitFor(() => {
      expect(screen.getByText('hello.txt')).toBeInTheDocument()
    })
  })

  it('removes selected files', async () => {
    const user = userEvent.setup()
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, file)
    expect(screen.getByText('hello.txt')).toBeInTheDocument()
    
    const removeButton = screen.getByRole('button', { name: '' })
    await user.click(removeButton)
    
    expect(screen.queryByText('hello.txt')).not.toBeInTheDocument()
  })

  it('uploads files successfully', async () => {
    const user = userEvent.setup()
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, file)
    
    const uploadButton = screen.getByRole('button', { name: /upload 1 file/i })
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(mockUploadMultipleFiles).toHaveBeenCalledWith([file], mockOptions)
    })
    
    expect(mockOnFilesUploaded).toHaveBeenCalledWith([
      {
        success: true,
        file: expect.objectContaining({
          filename: 'test.txt',
        }),
      },
    ])
  })

  it('handles upload errors', async () => {
    const user = userEvent.setup()
    mockUploadMultipleFiles.mockResolvedValue([
      {
        success: false,
        error: 'Upload failed',
      },
    ])
    
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    )
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, file)
    
    const uploadButton = screen.getByRole('button', { name: /upload 1 file/i })
    await user.click(uploadButton)
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Upload failed')
    })
  })

  it('disables upload when disabled prop is true', () => {
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
        disabled={true}
      />
    )
    
    const input = screen.getByRole('textbox', { hidden: true })
    expect(input).toBeDisabled()
  })

  it('handles single file mode', async () => {
    const user = userEvent.setup()
    render(
      <FileUpload
        options={mockOptions}
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
        multiple={false}
      />
    )
    
    expect(screen.getByText(/drop a file here or click to browse/i)).toBeInTheDocument()
    
    const file1 = new File(['hello1'], 'hello1.txt', { type: 'text/plain' })
    const file2 = new File(['hello2'], 'hello2.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, [file1, file2])
    
    // Should only show one file in single mode
    expect(screen.getByText('hello1.txt')).toBeInTheDocument()
    expect(screen.queryByText('hello2.txt')).not.toBeInTheDocument()
  })
})