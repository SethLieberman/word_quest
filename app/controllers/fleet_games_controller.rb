class FleetGamesController < ApplicationController
  before_action :private_response
  before_action :ensure_guest, only: [ :create, :join ]
  before_action :find_game, only: [ :show, :state, :ready, :shuffle, :fire ]
  before_action :authorize_player, only: [ :show, :state, :ready, :shuffle, :fire ]

  rescue_from FleetGame::RuleError, with: :rule_error
  rescue_from ActiveRecord::RecordNotFound do
    unavailable("This game could not be found. Check the link or create a new game.", :not_found)
  end
  rescue_from ActiveRecord::StaleObjectError, ActiveRecord::StatementInvalid do |error|
    Rails.logger.error("Fleet game could not be updated: #{error.class}: #{error.message}")
    unavailable("The game could not be updated. Please refresh before trying again.", :service_unavailable)
  end

  def index
  end

  def create
    game = FleetGame.create!(player_one_digest: FleetGame.guest_digest(guest))
    redirect_to fleet_game_path(game.token), status: :see_other
  end

  def invitation
    @game = FleetGame.find_by!(invitation_token: params[:token])
    return unavailable("This invitation has expired. Ask your friend to create a new game.", :gone) if @game.expired?
    return redirect_to fleet_game_path(@game.token) unless @game.seat_for(guest).nil?
    unavailable("Both seats are already taken. Ask your friend to create a new game.", :conflict) if @game.player_two_digest.present?
  end

  def join
    @game = FleetGame.find_by!(invitation_token: params[:token])
    @game.join!(guest)
    redirect_to fleet_game_path(@game.token), status: :see_other
  end

  def show
    @invitation_url = fleet_invitation_url(@game.invitation_token)
  end

  def state
    render json: @game.state_for(guest)
  end

  def ready
    @game.ready!(guest)
    render json: @game.state_for(guest)
  end

  def shuffle
    @game.shuffle!(guest)
    render json: @game.state_for(guest)
  end

  def fire
    cell = params[:cell]
    @game.fire!(guest, cell)
    render json: @game.state_for(guest)
  end

  private

  def guest
    cookies.encrypted[:fleet_guest]
  end

  def ensure_guest
    return if guest.present?
    cookies.encrypted[:fleet_guest] = {
      value: SecureRandom.hex(32), expires: 30.days.from_now,
      httponly: true, secure: request.ssl?, same_site: :lax
    }
  end

  def private_response
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "same-origin"
  end

  def find_game
    @game = FleetGame.find_by!(token: params[:id])
  end

  def authorize_player
    return unavailable("This game has expired. Create a new game to play together.", :gone) if @game.expired?
    unavailable("This browser does not have a seat. Open your friend's invitation link to join.", :forbidden) if @game.seat_for(guest).nil?
  end

  def rule_error(error)
    unavailable(error.message, :unprocessable_entity)
  end

  def unavailable(message, status)
    if request.format.json?
      render json: { error: message }, status: status
    else
      @message = message
      render :unavailable, status: status
    end
  end
end
