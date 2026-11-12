module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :fleet_guest

    def connect
      self.fleet_guest = cookies.encrypted[:fleet_guest]
      reject_unauthorized_connection if fleet_guest.blank?
    end
  end
end
