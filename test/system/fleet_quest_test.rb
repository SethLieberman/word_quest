require "application_system_test_case"

class FleetQuestTest < ApplicationSystemTestCase
  setup do
    @previous_forgery_protection = FleetGamesController.allow_forgery_protection
    FleetGamesController.allow_forgery_protection = true
    visit fleet_games_url
    assert_current_path fleet_games_path
    click_button "Create game"
    assert_text "You are Player 1."
    assert_text "Live updates connected."
    @room_path = URI(page.current_url).path
    @invitation = find("#fleet-invitation").value
    @game = FleetGame.find_by!(token: @room_path.split("/").last)
  end

  teardown do
    FleetGamesController.allow_forgery_protection = @previous_forgery_protection
  end

  test "private invitation claims a second browser seat and both guests reconnect after reload" do
    assert_text "Waiting for your friend to join."
    assert_selector "[data-fleet-target='own'] .has-ship", count: 7
    assert_selector "[data-fleet-target='opponent'] button:disabled", count: 36
    assert_no_selector "[data-fleet-target='opponent'] .has-ship"
    click_button "Shuffle my fleet"
    assert_selector "[data-fleet-target='own'] .has-ship", count: 7
    visit @invitation
    assert_current_path @room_path
    assert_text "You are Player 1."
    join_friend
    assert_text "Choose your fleet, then press Ready"
    assert_no_selector "#fleet-invitation"
    using_session(:visitor) do
      visit @invitation
      assert_text "Both seats are already taken."
      assert_no_button "Join game"
      visit @room_path
      assert_text "This browser does not have a seat."
    end
    visit @room_path
    assert_text "You are Player 1."
    using_session(:friend) do
      visit @room_path
      assert_text "You are Player 2."
      click_link "Choose a quest"
      assert_selector ".quest-card", count: 6
    end
  end

  test "two browsers play a complete live match with alternating turns and a win" do
    fixed_fleets
    join_friend
    disable_polling
    click_button "Ready to play"
    assert_text "Waiting for your friend to choose Ready"
    assert_no_button "Shuffle my fleet"
    using_session(:friend) do
      disable_polling
      click_button "Ready to play"
      assert_text "Your friend's turn."
    end
    assert_text "Your turn!"
    assert_equal "Your turn! | Fleet Quest", page.title
    assert_selector "[data-fleet-target='opponent'] button:not(:disabled)", count: 36
    target = @game.reload.fleets[1].flatten
    misses = (0...36).to_a - @game.fleets[0].flatten
    target.each_with_index do |cell, index|
      find("[data-fleet-target='opponent'] [data-cell='#{cell}']").click
      assert_text "Your friend's turn." unless index == target.length - 1
      assert_selector "[data-fleet-target='opponent'] .is-hit", count: index + 1
      sunk_cells = index < 2 ? 0 : index < 4 ? 3 : index < 6 ? 5 : 7
      assert_selector "[data-fleet-target='opponent'] .is-sunk", count: sunk_cells
      if index < 2
        assert_no_selector "[data-fleet-target='sunkNotice'].has-notice"
      else
        final_cell = index < 4 ? 20 : index < 6 ? 25 : 31
        coordinate = "#{('A'.ord + final_cell / 6).chr}#{final_cell % 6 + 1}"
        assert_selector "[data-fleet-target='sunkNotice'].has-notice",
          text: "Ship sunk! You sank your friend's ship with your shot at #{coordinate}."
      end
      using_session(:friend) do
        if index < 2
          assert_no_selector "[data-fleet-target='sunkNotice'].has-notice"
        else
          assert_selector "[data-fleet-target='sunkNotice'].has-notice",
            text: "Your friend sank one of your ships with their shot at #{coordinate}."
          assert_selector "[data-fleet-target='own'] .is-sunk", count: sunk_cells
        end
        if index == target.length - 1
          assert_text "Your friend found your fleet!"
          assert_selector "[data-fleet-target='opponent'] button:disabled", count: 36
        else
          assert_text "Your turn!"
          assert_equal "Your turn! | Fleet Quest", page.title
          find("[data-fleet-target='opponent'] [data-cell='#{misses[index]}']").click
          assert_text "Your friend's turn."
        end
      end
      assert_text "Your turn!" unless index == target.length - 1
    end
    assert_text "You found the whole fleet! You win!"
    assert_selector "[data-fleet-target='opponent'] button:disabled", count: 36
    visit @room_path
    assert_text "You found the whole fleet! You win!"
    assert_selector "[data-fleet-target='opponent'] .is-hit", count: 7
    assert_selector "[data-fleet-target='sunkNotice']", text: "Ship sunk! You sank your friend's ship with your shot at F2."
    assert_selector "[data-fleet-target='opponent'] .is-sunk", count: 7
  end

  test "turn sound is opt in and sounds once when the other player passes the turn" do
    join_friend
    assert_button "Enable turn sounds"
    assert_selector "[data-fleet-target='sound'][aria-pressed='false']"
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.audio = {state: "running", resume: () => Promise.resolve(), close: () => Promise.resolve()};
      window.fleetChimes = 0;
      controller.chime = () => { window.fleetChimes += 1; };
    JS
    click_button "Enable turn sounds"
    assert_selector "[data-fleet-target='sound'][aria-pressed='true']"
    assert_equal 1, page.evaluate_script("window.fleetChimes")
    click_button "Ready to play"
    using_session(:friend) { click_button "Ready to play" }
    assert_text "Your turn!"
    assert_equal 2, page.evaluate_script("window.fleetChimes")
    click_button "Refresh game"
    assert_equal 2, page.evaluate_script("window.fleetChimes")
    find("[data-fleet-target='opponent'] [data-cell='0']").click
    using_session(:friend) do
      assert_text "Your turn!"
      find("[data-fleet-target='opponent'] [data-cell='0']").click
    end
    assert_text "Your turn!"
    assert_equal 3, page.evaluate_script("window.fleetChimes")
    click_button "Turn sounds on - turn off"
    assert_button "Enable turn sounds"
    assert_selector "[data-fleet-target='sound'][aria-pressed='false']"
  end

  test "connection errors and expiry are visible and mobile boards support keyboard moves" do
    join_friend
    [ 320, 375, 1400 ].each do |width|
      page.current_window.resize_to(width, 1200)
      assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth"), "Room should fit at #{width}px"
    end
    page.current_window.resize_to(320, 1200)
    click_button "Ready to play"
    using_session(:friend) { click_button "Ready to play" }
    assert_text "Your turn!"
    find(".fleet-settings summary").click
    find("[data-fleet-target='opponent'] [data-cell='0']").send_keys(:enter)
    assert_text "Your friend's turn."
    page.execute_script(<<~JS)
      window.originalFleetFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error("Connection interrupted for test"));
    JS
    click_button "Refresh game"
    assert_text "Connection interrupted for test"
    page.execute_script("window.fetch = window.originalFleetFetch")
    click_button "Refresh game"
    assert_no_text "Connection interrupted for test"
    @game.reload.update!(expires_at: 1.second.ago)
    click_button "Refresh game"
    assert_text "This game has expired."
    assert_selector "[data-fleet-target='opponent'] button:disabled", count: 36
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  test "sound failures and manual copy fallback have visible explanations" do
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.audio = {
        resume: () => Promise.reject(new Error("Audio unavailable for test")),
        close: () => Promise.resolve()
      };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true, value: {writeText: () => Promise.reject(new Error("Clipboard unavailable for test"))}
      });
    JS
    click_button "Enable turn sounds"
    assert_text "Turn sounds are unavailable in this browser."
    assert_selector "[data-fleet-target='sound'][aria-pressed='false']"
    click_button "Copy invitation"
    assert_text "Automatic copying is unavailable."
    assert_equal @invitation, find("#fleet-invitation").value
    assert_equal "fleet-invitation", page.evaluate_script("document.activeElement.id")
  end

  test "phone play prioritizes the target board and preserves collapsible oceans across live updates" do
    page.current_window.resize_to(375, 812)
    assert_selector ".fleet-own-panel[open]"
    assert_no_selector ".fleet-settings[open]"
    assert_selector "[data-fleet-target='boards'] > :first-child.fleet-own-panel"
    assert_button "Shuffle my fleet"
    join_friend
    click_button "Ready to play"
    using_session(:friend) { click_button "Ready to play" }
    assert_text "Your turn!"
    assert_selector "[data-fleet-target='boards'] > :first-child[data-fleet-target='opponentPanel']"
    assert_no_selector ".fleet-own-panel[open]"
    assert_no_selector "[data-fleet-target='own'] .fleet-cell"
    assert_selector "[data-fleet-target='opponent'] button:not(:disabled)", count: 36
    [ 320, 375 ].each do |width|
      page.current_window.resize_to(width, 812)
      assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth")
      assert page.evaluate_script(<<~JS)
        [...document.querySelectorAll("[data-fleet-target='opponent'] button")].every((button) => {
          const box = button.getBoundingClientRect();
          return box.width >= 40 && box.height >= 44;
        })
      JS
    end
    find("[data-fleet-target='opponent'] [data-cell='0']").send_keys(:enter)
    assert_text "Your friend's turn."
    find(".fleet-own-panel summary").send_keys(:enter)
    assert_selector ".fleet-own-panel[open]"
    using_session(:friend) do
      assert_text "Your turn!"
      find("[data-fleet-target='opponent'] [data-cell='0']").click
    end
    assert_text "Your turn!"
    assert_selector ".fleet-own-panel[open]"
    find(".fleet-own-panel summary").click
    assert_no_selector ".fleet-own-panel[open]"
    find(".fleet-settings summary").click
    click_button "Refresh game"
    assert_no_selector ".fleet-own-panel[open]"
    page.execute_script("document.querySelector('[data-fleet-target=\"opponent\"]').scrollIntoView()")
    assert page.evaluate_script(<<~JS)
      (() => {
        const banner = document.querySelector("[data-fleet-target='status']").getBoundingClientRect();
        const button = document.querySelector("[data-fleet-target='opponent'] button").getBoundingClientRect();
        return Math.abs(banner.top) <= 1 && banner.bottom <= 100 && button.top >= banner.bottom;
      })()
    JS
    page.current_window.resize_to(1400, 1000)
    assert_selector ".fleet-own-panel[open]"
    assert_selector ".fleet-settings[open]"
    assert page.evaluate_script(<<~JS)
      (() => {
        const own = document.querySelector(".fleet-own-panel").getBoundingClientRect();
        const opponent = document.querySelector("[data-fleet-target='opponentPanel']").getBoundingClientRect();
        return Math.abs(own.top - opponent.top) <= 1 && own.left > opponent.left;
      })()
    JS
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  private

  def join_friend
    using_session(:friend) do
      visit @invitation
      assert_text "You're invited!"
      click_button "Join game"
      assert_text "You are Player 2."
      assert_text "Live updates connected."
    end
  end

  def fixed_fleets
    @game.update!(fleets: [ [ [ 0, 1, 2 ], [ 6, 7 ], [ 12, 13 ] ], [ [ 18, 19, 20 ], [ 24, 25 ], [ 30, 31 ] ] ])
  end

  def disable_polling
    page.execute_script("clearInterval(#{controller_script}.interval)")
  end

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'fleet\']"), "fleet")'
  end
end
