namespace :traffic do
  desc "Print aggregate page views and estimated daily browsers (DAYS=30)"
  task report: :environment do
    days = ENV.fetch("DAYS", "30")
    abort "DAYS must be between 1 and 3650." unless days.match?(/\A\d+\z/) && days.to_i.between?(1, 3650)
    days = days.to_i

    today = Date.current
    first_day = today - days + 1
    events = TrafficEvent.where(visited_on: first_day..today)
    page_views_by_day = events.group(:visited_on).count
    browsers_by_day = events.group(:visited_on).distinct.count(:visitor_key)

    puts "Traffic report: #{first_day} through #{today}"
    puts "Page views: #{events.count}"
    puts "Daily browsers and page views:"
    (first_day..today).each do |date|
      puts "  #{date}: #{browsers_by_day.fetch(date, 0)} browsers, #{page_views_by_day.fetch(date, 0)} page views"
    end

    puts "Page views by page:"
    events.group(:page_key).count.sort_by { |_, count| -count }.each do |page, count|
      puts "  #{page}: #{count}"
    end
    puts "Browser counts are anonymous daily estimates, not identified people."
  end

  desc "Delete traffic events older than KEEP_DAYS (default 90)"
  task purge: :environment do
    keep_days = ENV.fetch("KEEP_DAYS", "90")
    abort "KEEP_DAYS must be between 1 and 3650." unless keep_days.match?(/\A\d+\z/) && keep_days.to_i.between?(1, 3650)

    cutoff = Date.current - keep_days.to_i + 1
    deleted = TrafficEvent.where("visited_on < ?", cutoff).delete_all
    puts "Deleted #{deleted} traffic events older than #{keep_days} days."
  end
end
