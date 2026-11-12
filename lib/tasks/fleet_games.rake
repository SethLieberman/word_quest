namespace :fleet_games do
  desc "Delete expired guest Fleet Quest rooms"
  task cleanup: :environment do
    count = FleetGame.where("expires_at <= ?", Time.current).delete_all
    puts "Deleted #{count} expired Fleet Quest rooms."
  end
end
