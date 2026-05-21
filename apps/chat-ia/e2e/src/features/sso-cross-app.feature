# SPRINT-E2E-5 2026-05-21: SSO cross-app chat-ia ↔ appEventos

@sso @cross-app
Feature: SSO cross-app sync
  As a wedding planner
  I want my session to persist between chat-ia and appEventos
  So that I don't re-login when switching apps

  Background:
    Given chat-ia is running on "https://chat-dev.bodasdehoy.com"
    And appEventos is running on "https://app-dev.bodasdehoy.com"

  @sso-login-chat-then-app
  Scenario: Login in chat-ia, session active in appEventos
    Given I am NOT logged in any app
    When I login in chat-ia as "test@bodasdehoy.com"
    Then the cookie "idTokenV0.1.0" should be set on ".bodasdehoy.com" domain
    When I visit appEventos
    Then the session should be active
    And appEventos should display my user profile
    And no re-login should be required

  @sso-login-app-then-chat
  Scenario: Login in appEventos, session active in chat-ia
    Given I am NOT logged in any app
    When I login in appEventos
    And the AuthBridge syncs to localStorage
    When I visit chat-ia
    Then chat-ia should auto-detect the session
    And redirect to /chat without showing /login

  @sso-logout-cross-app
  Scenario: Logout in one app clears session in both
    Given I am logged in both chat-ia and appEventos
    When I logout in chat-ia
    Then the cookie "idTokenV0.1.0" should be cleared on ".bodasdehoy.com"
    When I refresh appEventos
    Then appEventos should redirect to login

  @sso-token-refresh-sync
  Scenario: Token refresh in one app updates the other
    Given I am logged in both apps
    When chat-ia auto-refreshes the Firebase token
    Then the new token should propagate via cookie
    And appEventos API calls should use the new token
