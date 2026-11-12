require "test_helper"

class FleetGameTest < ActiveSupport::TestCase
  include ActionCable::TestHelper

  setup do
    @one = SecureRandom.hex(32)
    @two = SecureRandom.hex(32)
    @game = FleetGame.create!(player_one_digest: FleetGame.guest_digest(@one))
  end

  test "fleets always have straight bounded distinct ships with seven occupied squares" do
    100.times do
      fleet = FleetGame.random_fleet
      assert_equal [ 3, 2, 2 ], fleet.map(&:length)
      assert_equal 7, fleet.flatten.uniq.length
      fleet.each do |ship|
        assert ship.all? { |cell| cell.between?(0, 35) }
        horizontal = ship.each_cons(2).all? { |left, right| right == left + 1 && right / 6 == left / 6 }
        vertical = ship.each_cons(2).all? { |left, right| right == left + 6 }
        assert horizontal || vertical
      end
    end
  end

  test "joining assigns only the second seat and cannot replace either player" do
    stale = FleetGame.find(@game.id)
    assert_equal 0, @game.join!(@one)
    assert_nil @game.reload.player_two_digest
    assert_equal 1, @game.join!(@two)
    assert_raises(FleetGame::RuleError) { stale.join!("late-third-browser") }
    digests = [ @game.player_one_digest, @game.player_two_digest ]
    assert_equal 1, @game.join!(@two)
    assert_raises(FleetGame::RuleError) { @game.join!("third-browser") }
    assert_equal digests, [ @game.reload.player_one_digest, @game.player_two_digest ]
    assert_nil @game.seat_for(nil)
    assert_nil @game.seat_for("stranger")
    assert_not_equal @game.token, @game.invitation_token
  end

  test "ready locks each fleet and only both ready players can start" do
    @game.ready!(@one)
    assert_raises(FleetGame::RuleError) { @game.shuffle!(@one) }
    assert_raises(FleetGame::RuleError) { @game.ready!(@one) }
    assert_raises(FleetGame::RuleError) { @game.fire!(@one, 0) }
    @game.join!(@two)
    own = @game.fleets[0]
    @game.shuffle!(@two)
    assert_equal own, @game.reload.fleets[0]
    assert_raises(FleetGame::RuleError) { @game.fire!(@two, 0) }
    @game.ready!(@two)
    assert_equal 0, @game.reload.turn
    @game.fire!(@one, 0)
    assert_equal 1, @game.reload.turn
  end

  test "shots alternate even after hits and reject invalid repeated and out of turn moves" do
    prepare_match
    hit = @game.fleets[1].flatten.first
    [ nil, "1", -1, 36, 1.5, true ].each do |cell|
      assert_no_changes -> { @game.reload.shots } do
        assert_raises(FleetGame::RuleError) { @game.fire!(@one, cell) }
      end
    end
    assert_raises(FleetGame::RuleError) { @game.fire!(@two, 0) }
    @game.fire!(@one, hit)
    assert_equal 1, @game.reload.turn
    assert_raises(FleetGame::RuleError) { @game.fire!(@one, 1) }
    @game.fire!(@two, 35)
    assert_equal 0, @game.reload.turn
    assert_raises(FleetGame::RuleError) { @game.fire!(@one, hit) }
    assert_equal [ hit ], @game.reload.shots[0]
    assert_raises(FleetGame::RuleError) { @game.fire!("stranger", 2) }
  end

  test "state exposes only the player's fleet and shot outcomes and marks sunk ships" do
    prepare_match
    @game.update!(fleets: [ [ [ 0, 1, 2 ], [ 6, 7 ], [ 12, 13 ] ], [ [ 18, 19, 20 ], [ 24, 25 ], [ 30, 31 ] ] ])
    before = @game.state_for(@one)
    assert_equal %i[revision player size joined ready turn winner fleet outgoing incoming expires_at], before.keys
    assert_equal @game.fleets[0], before[:fleet]
    assert_empty before[:outgoing]
    @game.fire!(@one, 24)
    @game.fire!(@two, 35)
    @game.fire!(@one, 25)
    state = @game.state_for(@one)
    assert_equal [ { cell: 24, hit: true, sunk: true }, { cell: 25, hit: true, sunk: true } ], state[:outgoing]
    assert_equal [ { cell: 35, hit: false, sunk: false } ], state[:incoming]
    assert_equal @game.fleets[1], @game.state_for(@two)[:fleet]
    assert_raises(FleetGame::RuleError) { @game.state_for("stranger") }
  end

  test "finding all seven squares finishes the match and prevents further moves" do
    prepare_match
    target = @game.fleets[1].flatten
    misses = (0...36).to_a - @game.fleets[0].flatten
    target.each_with_index do |cell, index|
      @game.fire!(@one, cell)
      @game.fire!(@two, misses[index]) unless index == target.length - 1
    end
    assert_equal 0, @game.reload.winner
    assert_equal 1, @game.state_for(@one)[:winner]
    assert_equal 7, @game.shots[0].length
    assert_raises(FleetGame::RuleError) { @game.fire!(@two, 0) }
    assert_raises(FleetGame::RuleError) { @game.fire!(@one, 35) }
  end

  test "expired rooms reject joining reading and mutations and actions extend expiry" do
    travel 1.hour do
      original = @game.expires_at
      @game.ready!(@one)
      assert_operator @game.reload.expires_at, :>, original
    end
    @game.update!(expires_at: 1.second.ago)
    assert_raises(FleetGame::RuleError) { @game.join!(@two) }
    assert_raises(FleetGame::RuleError) { @game.state_for(@one) }
    assert_raises(FleetGame::RuleError) { @game.shuffle!(@one) }
    assert_raises(FleetGame::RuleError) { @game.ready!(@one) }
    assert_raises(FleetGame::RuleError) { @game.fire!(@one, 0) }
  end

  test "updates broadcast only a revision and stale instances reload before moves" do
    stream = FleetGameChannel.broadcasting_for(@game)
    stale = FleetGame.find(@game.id)
    assert_broadcast_on(stream, revision: 1) { @game.join!(@two) }
    stale.ready!(@one)
    assert_equal [ true, false ], @game.reload.ready_players
    assert_equal @game.player_two_digest, stale.player_two_digest
    assert_equal 2, stale.lock_version
  end

  private

  def prepare_match
    @game.join!(@two)
    @game.ready!(@one)
    @game.ready!(@two)
  end
end
