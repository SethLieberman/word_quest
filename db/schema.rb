# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_11_12_143000) do
  create_table "fleet_games", force: :cascade do |t|
    t.string "token", null: false
    t.string "invitation_token", null: false
    t.string "player_one_digest", null: false
    t.string "player_two_digest"
    t.json "fleets", null: false
    t.json "shots", default: [[], []], null: false
    t.json "ready_players", default: [false, false], null: false
    t.integer "turn", default: 0, null: false
    t.integer "winner"
    t.integer "lock_version", default: 0, null: false
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_fleet_games_on_expires_at"
    t.index ["invitation_token"], name: "index_fleet_games_on_invitation_token", unique: true
    t.index ["token"], name: "index_fleet_games_on_token", unique: true
  end
end
