class CreateTrafficEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :traffic_events do |t|
      t.date :visited_on, null: false
      t.string :visitor_key, null: false
      t.string :page_key, null: false

      t.timestamps
    end

    add_index :traffic_events, [ :visited_on, :visitor_key ]
    add_index :traffic_events, [ :visited_on, :page_key ]
  end
end
