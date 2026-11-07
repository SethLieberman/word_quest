require "test_helper"

class GamesControllerTest < ActionDispatch::IntegrationTest
  test "landing page links to all educational activities" do
    get root_url

    assert_response :success
    assert_select ".quest-card", count: 3
    assert_select "a.quest-card[href=?]", word_quest_path, text: /Word Quest/
    assert_select "a.quest-card[href=?]", math_quest_path, text: /Math Quest/
    assert_select "a.quest-card[href=?]", read_aloud_path, text: /Read Aloud/
  end

  test "shows Math Quest with six levels and accessible answer input" do
    get math_quest_url

    assert_response :success
    assert_select "title", "Math Quest | Let's grow your number power"
    assert_select "[data-controller='math']"
    assert_select "[data-math-target='level']", count: 6
    assert_select "[data-level='sprout'][aria-pressed='true']"
    assert_select "label[for='math-answer']", text: "Your answer"
    assert_select "input#math-answer[inputmode='numeric']"
    assert_select "[data-math-target='bar'][aria-valuemax='10']"
    assert_select "a[href=?]", root_path
    assert_select "dialog", count: 2
  end

  test "shows the spelling game with all difficulty levels" do
    get word_quest_url

    assert_response :success
    assert_select "title", "Word Quest | Let's grow your word power"
    assert_select "[data-controller='game']"
    assert_select "[data-game-target='level']", count: 6
    assert_select "[data-level='jumble']", text: /Word jumble.*JUMBLE/
    assert_select "[data-level='mastermind']", text: /Mastermind.*EXPERT/
    assert_select "[data-level='advanced']", text: /Word scholar.*GRADE 4/
    assert_select "[data-level='easy'][aria-pressed='true']"
    assert_select "[data-game-target='slots']"
    assert_select "[data-game-target='round']", text: "WORD 1 OF 10"
    assert_select "[data-game-target='trailCount']", text: "0 of 10 discovered"
    assert_select "[data-game-target='goalBar'][aria-valuemax='10']"
    assert_select "dialog", count: 2
    assert_select "[data-game-target='helpDialog']" do
      assert_select "a[href='https://www.newgeneralservicelist.com/new-dolch-list']", text: "New Dolch List 1.1"
      assert_select "a[href='https://creativecommons.org/licenses/by-sa/4.0/']", text: "CC BY-SA 4.0"
    end
  end

  test "read aloud practice is reachable by URL" do
    get "/read-aloud"

    assert_response :success
    assert_select "title", "Read Aloud | Let's sound out words"
    assert_select "[data-controller='read-aloud']"
    assert_select "[data-read-aloud-target='level']", count: 8
    assert_select "[data-level='beginner'][aria-pressed='true']", text: "Beginning words"
    assert_select "[data-level='easy'][aria-pressed='false']", text: "Easy words"
    assert_select "[data-level='medium'][aria-pressed='false']", text: "Medium words"
    assert_select "[data-level='families']", text: "Word families"
    assert_select "[data-level='blends']", text: "Blends"
    assert_select "[data-level='digraphs']", text: "Two-letter sounds"
    assert_select "[data-level='silent_e']", text: "Silent e"
    assert_select "[data-level='sentences']", text: "Phrases & sentences"
    assert_select "[data-mode='build']", text: "Build from sounds"
    assert_select "[data-read-aloud-target='builder'][hidden]"
    assert_select "button[data-action='read-aloud#markPracticed']", text: "I practiced reading"
    assert_select "#read-aloud-picture[data-read-aloud-target='emoji'][hidden]"
    assert_select "button[data-action='read-aloud#togglePicture'][aria-expanded='false'][aria-controls='read-aloud-picture']", text: "Show picture"
    assert_select "[data-read-aloud-target='mic']"
    assert_select "[data-read-aloud-target='typed']"
    assert_select "input#read-aloud-typed-input"
    assert_select "a[href=?]", root_path, text: "Choose a quest"
  end

  test "read aloud practice is linked from both game navigation menus" do
    [ word_quest_path, math_quest_path ].each do |path|
      get path
      assert_select "nav[aria-label='Main navigation'] a[href=?][aria-label='Read Aloud']", read_aloud_path, count: 1
    end
  end
end
