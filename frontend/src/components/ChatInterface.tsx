import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Code,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { Message, QuestionSuggestion } from '../types';
import { formatDateTime } from '../utils/queryParser';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

// Sugestoes de perguntas pre-definidas
const QUESTION_SUGGESTIONS: QuestionSuggestion[] = [
  { text: 'Quais foram as vendas de hoje?', category: 'vendas' },
  { text: 'Qual o faturamento total do mes?', category: 'vendas' },
  { text: 'Quais os produtos mais vendidos?', category: 'produtos' },
  { text: 'Quantos clientes novos este mes?', category: 'clientes' },
  { text: 'Mostre as transacoes pendentes', category: 'vendas' },
  { text: 'Qual a media de vendas por dia?', category: 'analise' },
];

export default function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll para a ultima mensagem
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Verifica se deve mostrar botao de scroll
  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  // Scroll automatico quando novas mensagens chegam
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Monitora scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  // Handler para enviar mensagem
  const handleSendMessage = useCallback(() => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    onSendMessage(trimmedMessage);
    setInputValue('');
    setShowSuggestions(false);

    // Foca no input apos enviar
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputValue, isLoading, onSendMessage]);

  // Handler para tecla Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Handler para clique em sugestao
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSendMessage(suggestion);
      setShowSuggestions(false);
    },
    [onSendMessage]
  );

  // Auto-resize do textarea
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);

      // Auto-resize
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    },
    []
  );

  // Renderiza uma mensagem
  const renderMessage = useCallback((message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
      >
        <div className={`flex gap-3 max-w-[90%] ${isUser ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-indigo-600' : 'bg-gray-100'
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-gray-600" />
            )}
          </div>

          {/* Conteudo */}
          <div className="flex flex-col gap-1">
            <div
              className={isUser ? 'message-user' : 'message-assistant'}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>

              {/* SQL Query exibida */}
              {message.sqlQuery && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Code className="w-3 h-3" />
                    <span>Query SQL gerada:</span>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                    {message.sqlQuery}
                  </pre>
                </div>
              )}

              {/* Contador de resultados */}
              {message.resultCount !== undefined && (
                <div className="mt-2 text-xs text-gray-500">
                  {message.resultCount} resultado(s) encontrado(s)
                </div>
              )}
            </div>

            {/* Timestamp */}
            <span
              className={`text-xs text-gray-400 ${
                isUser ? 'text-right' : 'text-left'
              }`}
            >
              {formatDateTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="chat-container h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Assistente de Dados</h3>
            <p className="text-xs text-gray-500">
              Pergunte sobre seus dados em linguagem natural
            </p>
          </div>
        </div>
      </div>

      {/* Area de mensagens */}
      <div
        ref={messagesContainerRef}
        className="chat-messages flex-1 overflow-y-auto relative"
      >
        {/* Estado inicial com sugestoes */}
        {messages.length === 0 && showSuggestions && (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ola! Como posso ajudar?
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-sm">
              Faca perguntas sobre seus dados em portugues. Eu vou traduzir para
              SQL e buscar as informacoes.
            </p>

            <div className="w-full max-w-md">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Sugestoes de perguntas:
              </p>
              <div className="flex flex-wrap gap-2">
                {QUESTION_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de mensagens */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map(renderMessage)}

            {/* Indicador de loading */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="message-assistant">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-gray-500">Analisando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Botao de scroll para baixo */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="chat-input-container">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            rows={1}
            disabled={isLoading}
            className="textarea-field min-h-[44px] max-h-[120px] py-2.5"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary px-4 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Dica */}
        <p className="text-xs text-gray-400 mt-2">
          Pressione Enter para enviar ou Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
