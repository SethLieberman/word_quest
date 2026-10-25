require "test_helper"

class GamesControllerTest < ActionDispatch::IntegrationTest
  test "shows the spelling game with all difficulty levels" do
    get root_url

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
end
