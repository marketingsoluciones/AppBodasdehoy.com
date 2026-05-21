# SPRINT-E2E-2 2026-05-21: Chat smoke E2E — PREREQUISITO Sprint-Q profundo
# Cubre flujo crítico: enviar mensaje → recibir respuesta IA via api-ia proxy

@chat @smoke
Feature: Chat smoke flow
  As a logged-in user
  I want to send messages and receive AI responses
  So that the core chat functionality works end-to-end

  Background:
    Given I am logged in as "test@bodasdehoy.com"
    And I visit "/chat"
    And the api-ia backend is responding at "https://api-ia.bodasdehoy.com"

  @chat-send-message
  Scenario: Send a message and receive response
    Given I am in the default chat session
    When I type "Hola, ¿qué puedo hacer en bodasdehoy?" in the input
    And I click "Send"
    Then a user message should appear in the conversation
    And the assistant should respond within 30 seconds
    And the response should not be empty
    And no error overlay should appear

  @chat-stream
  Scenario: Streaming response renders progressively
    Given I send a message that requires a long response
    When the response starts streaming
    Then chunks should appear incrementally (every <500ms)
    And the final response should be coherent
    And no runtime errors during streaming

  @chat-tool-invocation
  Scenario: Tool invocation renders inline
    Given I send "Genera 3 ideas de venues para mi boda en Madrid"
    When the AI invokes the venue-visualizer tool
    Then the inline tool render should display 3 venue cards
    And each card should have a placeholder/image

  @chat-error-handling
  Scenario: Graceful error on api-ia failure
    Given api-ia is unreachable
    When I send a message
    Then an error message should display
    And the user can retry without refresh

  @chat-session-switch
  Scenario: Switch between sessions
    Given I have 3 chat sessions
    When I click on session 2
    Then the conversation history of session 2 should load
    And the active session indicator should update

  @chat-no-bundle-error
  Scenario: No bundle errors on /chat cold load
    Given I clear browser cache
    When I visit "/chat" for the first time
    Then there should be no "module not found" errors
    And there should be no failed chunk loads
    And First Contentful Paint should be < 3 seconds
