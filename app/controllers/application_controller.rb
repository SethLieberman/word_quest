require "securerandom"

class ApplicationController < ActionController::Base
  after_action :record_traffic_event, if: :trackable_page_view?

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  private

  def trackable_page_view?
    request.get? && response.successful? && request.format.html? &&
      request.path != "/up" && !request.user_agent.to_s.match?(/bot|crawler|spider|slurp|headlesschrome/i)
  end

  def record_traffic_event
    today = Date.current.iso8601
    cookie_value = cookies.signed[:wq_daily_visitor]
    visitor_key = cookie_value.to_s.delete_prefix("#{today}:") if cookie_value.to_s.start_with?("#{today}:")
    unless visitor_key
      visitor_key = SecureRandom.hex(16)
      cookies.signed[:wq_daily_visitor] = {
        value: "#{today}:#{visitor_key}",
        expires: Time.current.end_of_day,
        httponly: true,
        same_site: :lax,
        secure: request.ssl?
      }
    end

    TrafficEvent.create!(visited_on: Date.current, visitor_key:, page_key: "#{controller_path}##{action_name}")
  rescue ActiveRecord::ActiveRecordError => error
    Rails.logger.warn("Traffic tracking failed (#{error.class})")
  end
end
