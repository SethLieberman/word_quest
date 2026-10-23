require "test_helper"

class GamesControllerTest < ActionDispatch::IntegrationTest
  test "shows the spelling game with all difficulty levels" do
    get root_url

    assert_response :success
    assert_select "title", "Word Quest | Let's grow your word power"
    assert_select "[data-controller='game']"
    assert_select "[data-game-target='level']", count: 4
    assert_select "[data-level='advanced']", text: /Word scholar.*GRADE 4/
    assert_select "[data-level='easy'][aria-pressed='true']"
    assert_select "[data-game-target='slots']"
    assert_select "dialog", count: 2
  end
end
