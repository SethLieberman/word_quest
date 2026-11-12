class CreateFleetGames < ActiveRecord::Migration[8.0]
  def change
    create_table :fleet_games do |t|
      t.string :token, null: false
      t.string :invitation_token, null: false
      t.string :player_one_digest, null: false
      t.string :player_two_digest
      t.json :fleets, null: false
      t.json :shots, null: false, default: [ [], [] ]
      t.json :ready_players, null: false, default: [ false, false ]
      t.integer :turn, null: false, default: 0
      t.integer :winner
      t.integer :lock_version, null: false, default: 0
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :fleet_games, :token, unique: true
    add_index :fleet_games, :invitation_token, unique: true
    add_index :fleet_games, :expires_at
  end
end
