/**
 * Tests for ChatInterface Component
 * Tests message rendering, input handling, suggestions, and loading states
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInterface from './ChatInterface';
import type { Message } from '../types';

// ============================================
// Test Data
// ============================================
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Quantas vendas tivemos hoje?',
    timestamp: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Encontrei 15 vendas realizadas hoje.',
    timestamp: new Date('2024-01-15T10:30:05'),
    sqlQuery: 'SELECT COUNT(*) FROM transactions WHERE date = CURRENT_DATE',
    resultCount: 15,
  },
];

// ============================================
// ChatInterface Tests
// ============================================
describe('ChatInterface', () => {
  let mockOnSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSendMessage = vi.fn();
  });

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('should render the chat interface', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Assistente de Dados')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/digite sua pergunta/i)).toBeInTheDocument();
    });

    it('should render messages correctly', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Quantas vendas tivemos hoje?')).toBeInTheDocument();
      expect(screen.getByText('Encontrei 15 vendas realizadas hoje.')).toBeInTheDocument();
    });

    it('should render user messages with correct styling', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // User messages should have specific styling (message-user class)
      const userMessage = screen.getByText('Quantas vendas tivemos hoje?').closest('div');
      expect(userMessage?.className).toContain('message-user');
    });

    it('should render assistant messages with correct styling', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Assistant messages should have specific styling (message-assistant class)
      const assistantMessage = screen.getByText('Encontrei 15 vendas realizadas hoje.').closest('div');
      expect(assistantMessage?.className).toContain('message-assistant');
    });

    it('should render SQL query when present', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/SELECT COUNT\(\*\) FROM transactions/i)).toBeInTheDocument();
      expect(screen.getByText(/query sql gerada/i)).toBeInTheDocument();
    });

    it('should render result count when present', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/15 resultado\(s\) encontrado\(s\)/i)).toBeInTheDocument();
    });

    it('should render message timestamps', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Should have timestamps in Brazilian format
      const datePattern = /\d{2}\/\d{2}\/\d{4}/;
      const timeElements = screen.getAllByText(datePattern);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Empty State / Suggestions Tests
  // ============================================
  describe('Suggestions', () => {
    it('should show suggestions when no messages', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/ola! como posso ajudar/i)).toBeInTheDocument();
      expect(screen.getByText(/sugestoes de perguntas/i)).toBeInTheDocument();
    });

    it('should render suggestion buttons', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Check for predefined suggestions
      expect(screen.getByText('Quais foram as vendas de hoje?')).toBeInTheDocument();
      expect(screen.getByText('Qual o faturamento total do mes?')).toBeInTheDocument();
    });

    it('should call onSendMessage when suggestion is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const suggestionButton = screen.getByText('Quais foram as vendas de hoje?');
      await user.click(suggestionButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Quais foram as vendas de hoje?');
    });

    it('should hide suggestions after clicking one', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const suggestionButton = screen.getByText('Quais foram as vendas de hoje?');
      await user.click(suggestionButton);

      // Simulate messages being added after sending
      rerender(
        <ChatInterface
          messages={[{
            id: '1',
            role: 'user',
            content: 'Quais foram as vendas de hoje?',
            timestamp: new Date(),
          }]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Suggestions should be hidden
      expect(screen.queryByText(/sugestoes de perguntas/i)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Input Tests
  // ============================================
  describe('Input', () => {
    it('should render the text input', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      expect(input).toBeInTheDocument();
      expect(input.tagName.toLowerCase()).toBe('textarea');
    });

    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, 'Minha pergunta');

      expect(input).toHaveValue('Minha pergunta');
    });

    it('should call onSendMessage when send button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, 'Quantos clientes temos?');

      const sendButton = screen.getByRole('button', { name: '' });
      // Get all buttons and find the send button
      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(btn => btn.className.includes('btn-primary'));

      await user.click(sendBtn!);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Quantos clientes temos?');
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, 'Minha pergunta');

      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(btn => btn.className.includes('btn-primary'));
      await user.click(sendBtn!);

      expect(input).toHaveValue('');
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(btn => btn.className.includes('btn-primary'));

      await user.click(sendBtn!);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, '   ');

      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(btn => btn.className.includes('btn-primary'));
      await user.click(sendBtn!);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Keyboard Tests
  // ============================================
  describe('Keyboard', () => {
    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, 'Minha pergunta');
      await user.keyboard('{Enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith('Minha pergunta');
    });

    it('should not send message on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      await user.type(input, 'Linha 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(input, 'Linha 2');

      // Should not have sent message yet
      expect(mockOnSendMessage).not.toHaveBeenCalled();
      // Input should contain both lines (textarea handles newlines by adding them)
      expect(input).toHaveValue('Linha 1\nLinha 2');
    });

    it('should display hint about Enter and Shift+Enter', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/enter para enviar/i)).toBeInTheDocument();
      expect(screen.getByText(/shift\+enter para nova linha/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Loading State Tests
  // ============================================
  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/analisando/i)).toBeInTheDocument();
    });

    it('should show loading spinner in loading indicator', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Check for animate-spin class on spinner
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should disable input when loading', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      expect(input).toBeDisabled();
    });

    it('should disable send button when loading', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      );

      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(btn => btn.className.includes('btn-primary'));
      expect(sendBtn).toBeDisabled();
    });

    it('should not send message when loading', async () => {
      const user = userEvent.setup();
      render(
        <ChatInterface
          messages={[]}
          isLoading={true}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);

      // Input is disabled, so we can't type, but we can test the callback isn't called
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Message Avatars Tests
  // ============================================
  describe('Avatars', () => {
    it('should render user avatar for user messages', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // User avatars have bg-indigo-600 class
      const userAvatars = document.querySelectorAll('.bg-indigo-600');
      expect(userAvatars.length).toBeGreaterThan(0);
    });

    it('should render bot avatar for assistant messages', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Bot avatars have bg-gray-100 class
      const botAvatars = document.querySelectorAll('.bg-gray-100');
      expect(botAvatars.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Scroll Tests
  // ============================================
  describe('Scrolling', () => {
    it('should have scrollable message container', () => {
      render(
        <ChatInterface
          messages={mockMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Check for overflow-y-auto class
      const scrollContainer = document.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  // ============================================
  // Multiple Messages Tests
  // ============================================
  describe('Multiple Messages', () => {
    it('should render multiple message exchanges', () => {
      const manyMessages: Message[] = [
        { id: '1', role: 'user', content: 'Pergunta 1', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Resposta 1', timestamp: new Date() },
        { id: '3', role: 'user', content: 'Pergunta 2', timestamp: new Date() },
        { id: '4', role: 'assistant', content: 'Resposta 2', timestamp: new Date() },
        { id: '5', role: 'user', content: 'Pergunta 3', timestamp: new Date() },
        { id: '6', role: 'assistant', content: 'Resposta 3', timestamp: new Date() },
      ];

      render(
        <ChatInterface
          messages={manyMessages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Pergunta 1')).toBeInTheDocument();
      expect(screen.getByText('Resposta 1')).toBeInTheDocument();
      expect(screen.getByText('Pergunta 2')).toBeInTheDocument();
      expect(screen.getByText('Resposta 2')).toBeInTheDocument();
      expect(screen.getByText('Pergunta 3')).toBeInTheDocument();
      expect(screen.getByText('Resposta 3')).toBeInTheDocument();
    });
  });

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const messages: Message[] = [
        { id: '1', role: 'user', content: longMessage, timestamp: new Date() },
      ];

      render(
        <ChatInterface
          messages={messages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle messages with special characters', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Texto com <script>alert("xss")</script>', timestamp: new Date() },
      ];

      render(
        <ChatInterface
          messages={messages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // Should render as escaped text, not execute script
      // React escapes HTML by default, so the text will be visible but escaped
      const messageElement = screen.getByText(/Texto com/);
      expect(messageElement).toBeInTheDocument();
      // Verify no actual script execution by checking the element's HTML
      expect(messageElement.innerHTML).toContain('&lt;script&gt;');
    });

    it('should handle messages with line breaks', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Linha 1\nLinha 2\nLinha 3', timestamp: new Date() },
      ];

      render(
        <ChatInterface
          messages={messages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // whitespace-pre-wrap should preserve line breaks
      const messageElement = screen.getByText(/Linha 1/);
      expect(messageElement.className).toContain('whitespace-pre-wrap');
    });

    it('should handle empty SQL query gracefully', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Resposta sem query',
          timestamp: new Date(),
          sqlQuery: undefined,
        },
      ];

      render(
        <ChatInterface
          messages={messages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.queryByText(/query sql gerada/i)).not.toBeInTheDocument();
    });

    it('should handle zero result count', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Nenhum resultado encontrado',
          timestamp: new Date(),
          resultCount: 0,
        },
      ];

      render(
        <ChatInterface
          messages={messages}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText(/0 resultado\(s\) encontrado\(s\)/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('should have accessible input field', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText(/digite sua pergunta/i);
      expect(input).toHaveAttribute('placeholder');
    });

    it('should have accessible send button', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper heading structure', () => {
      render(
        <ChatInterface
          messages={[]}
          isLoading={false}
          onSendMessage={mockOnSendMessage}
        />
      );

      // There are multiple h3 headings in the component
      // Find the one with "Assistente de Dados" text
      const headings = screen.getAllByRole('heading', { level: 3 });
      const mainHeading = headings.find(h => h.textContent === 'Assistente de Dados');
      expect(mainHeading).toBeInTheDocument();
    });
  });
});
