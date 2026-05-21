# SPRINT-E2E-4 2026-05-21: Visitor limits + guest mode E2E

@visitor @guest
Feature: Visitor and guest limits
  As a non-registered user (visitor) or guest
  I want to use chat-ia within free tier limits
  So that I can experience the product before registering

  Background:
    Given the api-ia backend is responding
    And the chat-ia dev server is running

  @visitor-message-limit
  Scenario: Visitor receives login prompt after 5 messages
    Given I am an anonymous visitor (no auth)
    When I send 5 messages in one session
    Then on the 6th message attempt
    Then a "Crea una cuenta gratuita" modal should appear
    And the chat input should be blocked

  @visitor-system-prompt
  Scenario: Visitor receives commercial system prompt
    Given I am an anonymous visitor
    When I send "Cómo organizo mi boda?"
    Then the AI response should be COMMERCIAL (not technical)
    And it should mention bodasdehoy features
    And it should invite to register at "https://app.bodasdehoy.com/login?q=register"

  @guest-daily-limit
  Scenario: Guest user respects daily cap
    Given I am a guest user (cookie session, no Firebase auth)
    When I have sent 2 messages today
    Then on the 3rd message
    Then HTTP 429 should return with "Has alcanzado el límite diario"

  @visitor-no-leak
  Scenario: Visitor cannot access user data
    Given I am a visitor with NO valid auth
    But I have a stale SSO cookie from a previous session
    When I send a message
    Then the proxy should STRIP Authorization header before api-ia
    And no real user data should leak in response
