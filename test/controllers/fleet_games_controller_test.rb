require "test_helper"

class FleetGamesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @one = open_session
    @two = open_session
    @third = open_session
    @one.post fleet_games_path
    @game = FleetGame.order(:id).last
  end

  test "create remembers an encrypted guest seat and show never embeds fleets" do
    assert_equal 303, @one.response.status
    assert @one.cookies[:fleet_guest].present?
    @one.get fleet_game_path(@game.token)
    assert_equal 200, @one.response.status
    assert_equal "no-store", @one.response.headers["Cache-Control"]
    assert_equal "same-origin", @one.response.headers["Referrer-Policy"]
    assert_includes @one.response.body, fleet_invitation_path(@game.invitation_token)
    assert_not_includes @one.response.body, @game.player_one_digest
    @one.get state_fleet_game_path(@game.token), as: :json
    state = @one.response.parsed_body
    assert_equal 1, state.fetch("player")
    assert_equal @game.fleets[0], state.fetch("fleet")
    assert_equal %w[revision player size joined ready turn winner fleet outgoing incoming expires_at], state.keys
  end

  test "invitation GET cannot claim a seat and a third visitor cannot take over" do
    2.times { @two.get fleet_invitation_path(@game.invitation_token) }
    assert_equal 200, @two.response.status
    assert_nil @game.reload.player_two_digest
    @two.post fleet_invitation_path(@game.invitation_token)
    assert_equal 303, @two.response.status
    @two.get state_fleet_game_path(@game.token), as: :json
    assert_equal 2, @two.response.parsed_body.fetch("player")
    @one.post fleet_invitation_path(@game.invitation_token)
    assert_equal 303, @one.response.status
    digests = [ @game.reload.player_one_digest, @game.player_two_digest ]
    @third.get fleet_invitation_path(@game.invitation_token)
    assert_equal 409, @third.response.status
    @third.post fleet_invitation_path(@game.invitation_token)
    assert_equal 422, @third.response.status
    assert_equal digests, [ @game.reload.player_one_digest, @game.player_two_digest ]
    @two.get fleet_invitation_path(@game.invitation_token)
    assert_equal 302, @two.response.status
  end

  test "room links do not grant seats and unauthorized actions expose no state" do
    @third.get fleet_game_path(@game.token)
    assert_equal 403, @third.response.status
    @third.get state_fleet_game_path(@game.token), as: :json
    assert_equal 403, @third.response.status
    assert_equal [ "error" ], @third.response.parsed_body.keys
    [ ready_fleet_game_path(@game.token), shuffle_fleet_game_path(@game.token), fire_fleet_game_path(@game.token) ].each do |path|
      @third.post path, params: { cell: 0 }, as: :json
      assert_equal 403, @third.response.status
    end
    assert_empty @game.reload.shots.flatten
    assert_equal [ false, false ], @game.ready_players
  end

  test "server authorizes ready turn and cell values and retains state across reload" do
    @two.post fleet_invitation_path(@game.invitation_token)
    @one.post ready_fleet_game_path(@game.token), as: :json
    assert_equal 200, @one.response.status
    @two.post ready_fleet_game_path(@game.token), as: :json
    assert_equal 200, @two.response.status
    @two.post fire_fleet_game_path(@game.token), params: { cell: 0 }, as: :json
    assert_equal 422, @two.response.status
    @one.post fire_fleet_game_path(@game.token), params: { cell: "0" }, as: :json
    assert_equal 422, @one.response.status
    @one.post fire_fleet_game_path(@game.token), params: { cell: 0 }, as: :json
    assert_equal 200, @one.response.status
    assert_equal 2, @one.response.parsed_body.fetch("turn")
    @one.get state_fleet_game_path(@game.token), as: :json
    assert_equal [ 0 ], @one.response.parsed_body.fetch("outgoing").map { |shot| shot.fetch("cell") }
    @one.post shuffle_fleet_game_path(@game.token), as: :json
    assert_equal 422, @one.response.status
  end

  test "expired and unknown links show explicit errors" do
    @one.get state_fleet_game_path("missing"), as: :json
    assert_equal 404, @one.response.status
    @game.update!(expires_at: 1.second.ago)
    @one.get state_fleet_game_path(@game.token), as: :json
    assert_equal 410, @one.response.status
    @two.get fleet_invitation_path(@game.invitation_token)
    assert_equal 410, @two.response.status
    @two.post fleet_invitation_path(@game.invitation_token)
    assert_equal 422, @two.response.status
    @one.post ready_fleet_game_path(@game.token), as: :json
    assert_equal 410, @one.response.status
  end

  test "mutations require a valid CSRF token when forgery protection is enabled" do
    previous = FleetGamesController.allow_forgery_protection
    FleetGamesController.allow_forgery_protection = true
    @one.post ready_fleet_game_path(@game.token), as: :json
    assert_equal 422, @one.response.status
    assert_equal [ false, false ], @game.reload.ready_players
    @one.get fleet_game_path(@game.token)
    token = Nokogiri::HTML(@one.response.body).at_css('meta[name="csrf-token"]')["content"]
    @one.post ready_fleet_game_path(@game.token), as: :json, headers: { "X-CSRF-Token" => token }
    assert_equal 200, @one.response.status
    assert_equal [ true, false ], @game.reload.ready_players
  ensure
    FleetGamesController.allow_forgery_protection = previous
  end
end
