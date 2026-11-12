require "digest"

class FleetGame < ApplicationRecord
  SIZE = 6
  SHIP_LENGTHS = [ 3, 2, 2 ].freeze
  LIFETIME = 24.hours

  class RuleError < StandardError; end

  before_validation :initialize_room, on: :create
  after_update_commit :notify_players

  validates :token, :invitation_token, :player_one_digest, :fleets, :expires_at, presence: true

  def self.guest_digest(guest)
    Digest::SHA256.hexdigest(guest)
  end

  def self.random_fleet
    ships = []
    SHIP_LENGTHS.each do |length|
      options = (0...SIZE * SIZE).flat_map do |cell|
        row, column = cell.divmod(SIZE)
        [
          (Array.new(length) { |offset| cell + offset } if column + length <= SIZE),
          (Array.new(length) { |offset| cell + offset * SIZE } if row + length <= SIZE)
        ].compact
      end
      available = options.reject { |cells| (cells & ships.flatten).any? }
      ships << available.sample
    end
    ships
  end

  def seat_for(guest)
    return if guest.blank?
    digest = self.class.guest_digest(guest)
    return 0 if ActiveSupport::SecurityUtils.secure_compare(player_one_digest, digest)
    return 1 if player_two_digest.present? && ActiveSupport::SecurityUtils.secure_compare(player_two_digest, digest)
    nil
  end

  def expired?
    expires_at <= Time.current
  end

  def join!(guest)
    with_lock do
      ensure_active!
      seat = seat_for(guest)
      return seat unless seat.nil?
      raise RuleError, "Both seats are already taken. Ask your friend to create a new game." if player_two_digest.present?
      self.player_two_digest = self.class.guest_digest(guest)
      self.expires_at = LIFETIME.from_now
      save!
      1
    end
  end

  def shuffle!(guest)
    change_by!(guest) do |seat|
      raise RuleError, "Your fleet is already ready and cannot be changed." if ready_players[seat]
      self.fleets = fleets.each_with_index.map { |fleet, index| index == seat ? self.class.random_fleet : fleet }
    end
  end

  def ready!(guest)
    change_by!(guest) do |seat|
      raise RuleError, "Your fleet is already ready." if ready_players[seat]
      self.ready_players = ready_players.each_with_index.map { |ready, index| index == seat ? true : ready }
    end
  end

  def fire!(guest, cell)
    change_by!(guest) do |seat|
      raise RuleError, "Wait until both players are ready." unless ready_players.all? && player_two_digest.present?
      raise RuleError, "This game has finished. Create a new game to play again." unless winner.nil?
      raise RuleError, "It is not your turn yet." unless turn == seat
      raise RuleError, "Choose a square on the board." unless cell.is_a?(Integer) && cell.between?(0, SIZE * SIZE - 1)
      raise RuleError, "You already explored that square. Choose another one." if shots[seat].include?(cell)
      self.shots = shots.each_with_index.map { |list, index| index == seat ? list + [ cell ] : list }
      self.winner = seat if (fleets[1 - seat].flatten - shots[seat]).empty?
      self.turn = 1 - seat if winner.nil?
    end
  end

  def state_for(guest)
    ensure_active!
    seat = seat_for(guest)
    raise RuleError, "This browser does not have a seat in this game." if seat.nil?
    {
      revision: lock_version,
      player: seat + 1,
      size: SIZE,
      joined: player_two_digest.present?,
      ready: ready_players,
      turn: turn + 1,
      winner: winner.nil? ? nil : winner + 1,
      fleet: fleets[seat],
      outgoing: shot_results(seat),
      incoming: shot_results(1 - seat),
      expires_at: expires_at.iso8601
    }
  end

  private

  def initialize_room
    self.token ||= SecureRandom.urlsafe_base64(24)
    self.invitation_token ||= SecureRandom.urlsafe_base64(24)
    self.fleets ||= [ self.class.random_fleet, self.class.random_fleet ]
    self.expires_at ||= LIFETIME.from_now
  end

  def ensure_active!
    raise RuleError, "This game has expired. Create a new game to play together." if expired?
  end

  def change_by!(guest)
    with_lock do
      ensure_active!
      seat = seat_for(guest)
      raise RuleError, "This browser does not have a seat in this game." if seat.nil?
      yield seat
      self.expires_at = LIFETIME.from_now
      save!
    end
  end

  def shot_results(seat)
    target = fleets[1 - seat]
    shots[seat].map do |cell|
      ship = target.find { |cells| cells.include?(cell) }
      { cell: cell, hit: ship.present?, sunk: ship.present? && (ship - shots[seat]).empty? }
    end
  end

  def notify_players
    FleetGameChannel.broadcast_to(self, { revision: lock_version })
  end
end
