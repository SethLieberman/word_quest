require "test_helper"

class TrafficTrackingTest < ActionDispatch::IntegrationTest
  setup do
    TrafficEvent.delete_all
  end

  test "records successful HTML page views and reuses a daily anonymous browser key" do
    get root_url

    assert_response :success
    assert_select ".traffic-privacy-note", text: /random browser code that expires daily/
    first_event = TrafficEvent.sole
    assert_equal Date.current, first_event.visited_on
    assert_equal "games#index", first_event.page_key

    get code_breaker_url

    assert_response :success
    assert_equal 2, TrafficEvent.count
    assert_equal first_event.visitor_key, TrafficEvent.order(:id).last.visitor_key
    assert_equal [ "games#code_breaker", "games#index" ], TrafficEvent.distinct.order(:page_key).pluck(:page_key)
  end

  test "rotates the anonymous browser key on a new day" do
    get root_url
    first_key = TrafficEvent.sole.visitor_key

    travel_to 1.day.from_now do
      get code_breaker_url
    end

    assert_not_equal first_key, TrafficEvent.order(:id).last.visitor_key
  end

  test "does not record failed pages or obvious crawlers" do
    get "/not-a-page"
    assert_response :not_found
    assert_equal 0, TrafficEvent.count

    get root_url, headers: { "User-Agent" => "ExampleBot" }
    assert_response :success
    assert_equal 0, TrafficEvent.count
  end
end
