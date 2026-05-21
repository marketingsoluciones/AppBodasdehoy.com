# SPRINT-E2E-1 2026-05-21: Auth flow E2E base — PREREQUISITO Sprint-Q profundo
# Cubre Firebase login + SSO redirect entre chat-ia y appEventos

@auth @smoke
Feature: Authentication flow
  As a wedding planner
  I want to login with Firebase
  So that I can access chat-ia with my session synced to appEventos

  Background:
    Given the chat-ia dev server is running on port 3210
    And the Firebase auth is configured for tenant "bodasdehoy"

  @auth-firebase-email
  Scenario: Login with email/password
    Given I visit "/login"
    When I fill the email field with "test@bodasdehoy.com"
    And I fill the password field with "valid-password"
    And I click "Sign In"
    Then I should be redirected to "/chat"
    And the cookie "idTokenV0.1.0" should exist
    And the localStorage "mcp_jwt" should contain a valid JWT

  @auth-google-oauth
  Scenario: Login with Google OAuth
    Given I visit "/login"
    When I click "Sign in with Google"
    And I complete the Google OAuth flow with test account
    Then I should be redirected to "/chat"
    And the user profile should display "test@gmail.com"

  @auth-sso-cross-app
  Scenario: SSO cookie shared with appEventos
    Given I am logged in chat-ia as "test@bodasdehoy.com"
    When I visit "https://app-dev.bodasdehoy.com"
    Then the session should be active without re-login
    And the sessionBodas cookie should be valid

  @auth-logout
  Scenario: Logout clears session
    Given I am logged in chat-ia
    When I click "Sign Out"
    Then I should be redirected to "/login"
    And the cookie "idTokenV0.1.0" should be cleared

  @auth-token-refresh
  Scenario: Token auto-refresh on expiry
    Given I am logged in with token expiring in 60 seconds
    When 90 seconds pass
    Then the token should auto-refresh transparently
    And API calls to /webapi/chat should succeed with new token

  @auth-runtime-errors
  Scenario: No runtime errors during auth
    Given I visit "/login"
    When I complete any login flow
    Then there should be no console errors
    And no Next.js error overlay should appear
