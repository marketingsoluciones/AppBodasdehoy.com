# SPRINT-E2E-3 2026-05-21: Sessions CRUD E2E

@sessions
Feature: Session management
  As a logged-in user
  I want to create, switch and delete chat sessions
  So that I can organize conversations per topic

  Background:
    Given I am logged in
    And I visit "/chat"

  @sessions-create
  Scenario: Create a new session
    Given I have no sessions
    When I click "New session"
    Then a new session should appear in the sidebar
    And it should be active
    And the conversation should be empty

  @sessions-rename
  Scenario: Rename a session
    Given I have an active session
    When I click "Rename"
    And I type "Decoración rústica"
    And I press Enter
    Then the session name should update to "Decoración rústica"
    And the sidebar should reflect the new name

  @sessions-delete
  Scenario: Delete a session
    Given I have 2 sessions
    When I right-click session 1 and select "Delete"
    Then session 1 should be removed from the sidebar
    And I should be switched to session 2
    And no error overlay

  @sessions-persistence
  Scenario: Sessions persist after page reload
    Given I have 3 sessions
    When I reload the page
    Then all 3 sessions should still appear in the sidebar
    And the active session should remain selected

  @sessions-search
  Scenario: Search sessions
    Given I have 10 sessions with various names
    When I type "boda" in the session search
    Then only sessions containing "boda" should display
