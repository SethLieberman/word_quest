require "application_system_test_case"

class CodeBreakerTest < ApplicationSystemTestCase
  test "landing page opens the game and navigation returns to all six listed games" do
    visit root_url
    find("a.quest-card", text: "Code Breakers").click
    assert_current_path code_breaker_path
    assert_text "CODE 1 OF 10"
    assert_text "0 of 10 codes cracked"
    assert_selector "[data-level='easy'][aria-pressed='true']"
    assert_selector ".code-key li", count: 26
    assert_selector ".code-token[role='img'][aria-label]", count: 3
    assert_button "A little hint", disabled: false
    click_link "Choose a quest"
    assert_current_path root_path
    assert_selector ".quest-card", count: 6
  end

  test "all ninety puzzles decode correctly and follow their difficulty rules" do
    visit code_breaker_url
    report = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/code_breaker_puzzles").then(({puzzlesFor, TYPES, LEVELS, ROUND_LENGTH}) => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const puzzles = TYPES.flatMap((type) => LEVELS.flatMap((level) =>
          puzzlesFor(type, level).map((puzzle, index) => {
            const decoded = puzzle.words.map((word) => word.map((token) => {
              if (type === "numbers") return alphabet[level === "hard" ? 26 - Number(token.code) : Number(token.code) - 1];
              if (type === "shifts") {
                const shift = level === "easy" ? 1 : level === "medium" ? 3 : 7 + index;
                return alphabet[(alphabet.indexOf(token.code) - shift + 26) % 26];
              }
              return puzzle.key.find(({code}) => code === token.code).letter;
            }).join("")).join(" ");
            return {
              id: puzzle.id, type, level, answer: puzzle.answer, decoded, clue: puzzle.clue,
              hint: puzzle.hint, rule: puzzle.rule, keyCount: puzzle.key.length,
              uniqueCodes: new Set(puzzle.key.map(({code}) => code)).size,
              uniqueNames: new Set(puzzle.key.map(({name}) => name)).size,
              visible: puzzle.visibleKey.map(({letter}) => letter),
              missing: [...new Set(puzzle.answer.replaceAll(" ", ""))].filter((letter) =>
                !puzzle.visibleKey.some((entry) => entry.letter === letter)),
              wordLengths: puzzle.words.map((word) => word.length),
              fresh: puzzle.words !== puzzlesFor(type, level)[index].words
            };
          })
        ));
        const errors = [["unknown", "easy"], ["symbols", "unknown"]].map(([type, level]) => {
          try { puzzlesFor(type, level); return false; } catch (error) { return error.message.startsWith("Unknown code"); }
        });
        done({puzzles, errors, roundLength: ROUND_LENGTH});
      }).catch((error) => done({error: error.message}));
    JS
    assert_nil report["error"]
    assert_equal 10, report.fetch("roundLength")
    assert_equal [ true, true ], report.fetch("errors")
    puzzles = report.fetch("puzzles")
    assert_equal 90, puzzles.length
    assert_equal 90, puzzles.map { |puzzle| puzzle.fetch("id") }.uniq.length
    puzzles.group_by { |puzzle| [ puzzle.fetch("type"), puzzle.fetch("level") ] }.each_value do |bank|
      assert_equal 10, bank.length
      assert_equal 10, bank.map { |puzzle| puzzle.fetch("answer") }.uniq.length
    end
    puzzles.each do |puzzle|
      assert_equal puzzle.fetch("answer"), puzzle.fetch("decoded"), puzzle.fetch("id")
      assert_equal 26, puzzle.fetch("keyCount")
      assert_equal 26, puzzle.fetch("uniqueCodes")
      assert_equal 26, puzzle.fetch("uniqueNames")
      assert puzzle.fetch("clue").present?
      assert puzzle.fetch("hint").include?("means #{puzzle.fetch('answer')[0]}")
      assert puzzle.fetch("rule").present?
      assert puzzle.fetch("fresh")
      case puzzle.fetch("level")
      when "easy"
        assert_equal [ 3 ], puzzle.fetch("wordLengths")
        assert_equal 26, puzzle.fetch("visible").length
      when "medium"
        assert_equal [ 6 ], puzzle.fetch("wordLengths")
        assert_equal 26, puzzle.fetch("visible").length
      when "hard"
        assert_operator puzzle.fetch("wordLengths").length, :>=, 3
        if puzzle.fetch("type") == "symbols"
          assert_equal [ puzzle.fetch("answer")[0] ], puzzle.fetch("missing")
          assert_operator puzzle.fetch("visible").length, :>, 0
        else
          assert_empty puzzle.fetch("visible")
        end
      end
    end
  end

  test "empty and incorrect answers retry and each puzzle allows only one hint" do
    visit code_breaker_url
    [ "", "wrong", "123", "C A T", "cat!" ].each do |answer|
      fill_in "Your decoded message", with: answer
      click_button "Check my answer"
      assert_text "CODE 1 OF 10"
      assert_text "0 of 10 codes cracked"
      assert_selector "#code-answer[aria-invalid='true']"
    end
    assert_text "Not quite"
    click_button "A little hint"
    hint = find("#code-feedback").text
    assert_includes hint, "means C"
    assert_button "A little hint", disabled: true
    page.execute_script("#{controller_script}.hint()")
    assert_equal hint, find("#code-feedback").text
    fill_in "Your decoded message", with: " cat "
    find("#code-answer").send_keys(:enter)
    assert_text "Code cracked! The message is CAT."
    assert_text "1 of 10 codes cracked"
    assert_selector "#code-answer[disabled]"
    assert_no_selector "#code-answer[aria-invalid]"
    page.execute_script("#{controller_script}.hint()")
    assert_text "Code cracked!"
    assert_text "1 of 10 codes cracked"
    click_button "Next code"
    assert_text "CODE 2 OF 10"
    assert_button "A little hint", disabled: false
    assert_field "Your decoded message", with: ""
    assert_equal "code-answer", page.evaluate_script("document.activeElement.id")
  end

  test "all three code types complete all three levels and replay preserves choices" do
    visit code_breaker_url
    { "symbols" => "Symbol codes", "numbers" => "Number codes", "shifts" => "Letter shifts" }.each do |type, name|
      select name, from: "Code type"
      %w[easy medium hard].each do |level|
        find("[data-level='#{level}']").click
        answers = []
        10.times do |index|
          assert_text "CODE #{index + 1} OF 10"
          puzzle = page.evaluate_script("#{controller_script}.puzzle")
          answers << puzzle.fetch("answer")
          assert_selector ".code-word", count: puzzle.fetch("words").length
          assert_selector ".code-key li", count: puzzle.fetch("visibleKey").length
          click_button "A little hint"
          assert_text puzzle.fetch("hint")
          assert_button "A little hint", disabled: true
          fill_in "Your decoded message", with: puzzle.fetch("answer").downcase.gsub(" ", "   ")
          click_button "Check my answer"
          assert_text "#{index + 1} of 10 codes cracked"
          assert_selector "[role='progressbar'][aria-valuenow='#{index + 1}']"
          assert_button "A little hint", disabled: true
          if index == 9
            assert_text "You cracked all ten codes!"
            click_button "Play again"
          else
            click_button "Next code"
          end
        end
        assert_equal 10, answers.uniq.length
        assert_text "CODE 1 OF 10"
        assert_text "0 of 10 codes cracked"
        assert_selector "[data-level='#{level}'][aria-pressed='true']"
        assert_selector "#code-type option:checked", text: name
        assert_equal type, page.evaluate_script("#{controller_script}.type")
        assert_button "A little hint", disabled: false
      end
    end
  end

  test "changing type or level resets partial and solved puzzles and reload restores defaults" do
    visit code_breaker_url
    click_button "A little hint"
    fill_in "Your decoded message", with: "CAT"
    click_button "Check my answer"
    select "Number codes", from: "Code type"
    assert_text "CODE 1 OF 10"
    assert_text "0 of 10 codes cracked"
    assert_field "Your decoded message", with: ""
    assert_button "A little hint", disabled: false
    assert_button "Check my answer"
    find("[data-level='hard']").click
    assert_text "Z = 1"
    assert_text "The full key is hidden"
    assert_no_selector ".code-key li"
    click_button "A little hint"
    fill_in "Your decoded message", with: "something"
    find("[data-level='medium']").click
    assert_selector ".code-key li", count: 26
    assert_field "Your decoded message", with: ""
    assert_button "A little hint", disabled: false
    select "Letter shifts", from: "Code type"
    assert_text "3 steps backward"
    find("[data-level='hard']").click
    assert_text "7 steps backward"
    assert_no_selector ".code-key li"
    select "Symbol codes", from: "Code type"
    assert_text "One letter is missing"
    assert_operator all(".code-key li").length, :>, 0
    assert_operator all(".code-key li").length, :<, 26
    visit code_breaker_url
    assert_selector "#code-type option:checked", text: "Symbol codes"
    assert_selector "[data-level='easy'][aria-pressed='true']"
    assert_text "0 of 10 codes cracked"
  end

  test "all challenges fit mobile and support keyboard controls without changing other game storage" do
    visit code_breaker_url
    page.execute_script("localStorage.setItem('trivia-progress-v1', JSON.stringify({total: 3, stars: 6}))")
    before_storage = page.evaluate_script("JSON.stringify(Object.entries(localStorage).sort())")
    [ 320, 375, 1400 ].each do |width|
      page.current_window.resize_to(width, 1200)
      %w[Symbol\ codes Number\ codes Letter\ shifts].each do |type|
        select type, from: "Code type"
        %w[easy medium hard].each do |level|
          find("[data-level='#{level}']").send_keys(:enter)
          assert_selector "[data-level='#{level}'][aria-pressed='true']"
          assert page.evaluate_script("document.documentElement.scrollWidth <= innerWidth"), "#{type}/#{level} at #{width}px"
          answer = page.evaluate_script("#{controller_script}.puzzle.answer")
          fill_in "Your decoded message", with: answer
          find("#code-answer").send_keys(:enter)
          assert_text "Code cracked!"
          find("[data-code-breaker-target='checkButton']").send_keys(:enter)
          assert_text "CODE 2 OF 10"
        end
      end
    end
    assert_equal before_storage, page.evaluate_script("JSON.stringify(Object.entries(localStorage).sort())")
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  private

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'code-breaker\']"), "code-breaker")'
  end
end
