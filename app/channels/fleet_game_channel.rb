class FleetGameChannel < ApplicationCable::Channel
  def subscribed
    game = FleetGame.find_by(token: params[:token])
    if game.nil? || game.expired? || game.seat_for(connection.fleet_guest).nil?
      reject
    else
      stream_for game
    end
  end
end
