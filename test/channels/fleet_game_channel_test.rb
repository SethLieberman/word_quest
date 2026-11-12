require "test_helper"

class FleetGameChannelTest < ActionCable::Channel::TestCase
  setup do
    @guest = SecureRandom.hex(32)
    @game = FleetGame.create!(player_one_digest: FleetGame.guest_digest(@guest))
  end

  test "only a current player can subscribe" do
    stub_connection fleet_guest: @guest
    subscribe token: @game.token
    assert subscription.confirmed?
    assert_has_stream_for @game
  end

  test "invitation holders and strangers cannot subscribe" do
    stub_connection fleet_guest: "stranger"
    subscribe token: @game.token
    assert subscription.rejected?
    assert_no_streams
  end

  test "expired rooms cannot be subscribed to" do
    @game.update!(expires_at: 1.second.ago)
    stub_connection fleet_guest: @guest
    subscribe token: @game.token
    assert subscription.rejected?
    assert_no_streams
  end
end
