require "test_helper"

module ApplicationCable
  class ConnectionTest < ActionCable::Connection::TestCase
    test "connections without a guest cookie are rejected" do
      assert_reject_connection { connect }
    end

    test "encrypted guest cookies identify a connection" do
      cookies.encrypted[:fleet_guest] = "guest-connection-test"
      connect
      assert_equal "guest-connection-test", connection.fleet_guest
    end
  end
end
