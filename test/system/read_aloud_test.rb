require "application_system_test_case"

class ReadAloudTest < ApplicationSystemTestCase
  Capybara.enable_aria_label = true

  test "users can reach read aloud from the home page and game menus" do
    visit root_url
    find("a.quest-card", text: "Read Aloud").click
    assert_text "WORD 1 OF 34"
    click_link "Choose a quest"
    assert_current_path root_path

    [ word_quest_url, math_quest_url ].each do |url|
      visit url
      find("nav a[aria-label='Read Aloud']").click
      assert_current_path read_aloud_path
      assert_text "WORD 1 OF 34"
    end
  end

  test "beginning words are first and each level has its word bank" do
    visit read_aloud_url

    assert_text "WORD 1 OF 34"
    assert_text "bed"
    fill_in "read-aloud-typed-input", with: "bed"
    click_button "Check"
    assert_text "Yes! bed is right."
    assert_text "WORD 2 OF 34", wait: 3

    click_button "Easy words"
    assert_text "WORD 1 OF 50"
    click_button "Medium words"
    assert_text "WORD 1 OF 50"
  end

  test "pictures are optional and hidden again for new readings and activities" do
    visit read_aloud_url
    assert_no_selector "#read-aloud-picture"
    assert_selector "[data-read-aloud-target='pictureButton'][aria-expanded='false']", text: "Show picture"
    click_button "Show picture"
    assert_selector "#read-aloud-picture", text: "🛏️"
    assert_selector "[data-read-aloud-target='pictureButton'][aria-expanded='true']", text: "Hide picture"
    click_button "Hide picture"
    assert_no_selector "#read-aloud-picture"
    click_button "Show picture"
    fill_in "read-aloud-typed-input", with: "bed"
    click_button "Check", exact: true
    assert_text "WORD 2 OF 34", wait: 3
    assert_no_selector "#read-aloud-picture"
    click_button "Show picture"
    assert_selector "#read-aloud-picture", text: "🐞"
    click_button "Build from sounds"
    assert_no_selector "#read-aloud-picture"
    click_button "Show picture"
    assert_selector "#read-aloud-picture", text: "🐞"
    assert_button "A little hint", disabled: false
    assert_text "1 practiced"
    click_button "Word families"
    assert_no_selector "#read-aloud-picture"
    click_button "Read together"
    click_button "Show picture"
    click_button "Practice hat"
    assert_no_selector "#read-aloud-picture"
    click_button "Show picture"
    page.execute_script("#{controller_script}.restart()")
    assert_no_selector "#read-aloud-picture"
    click_button "Phrases & sentences"
    assert_no_selector "#read-aloud-picture"
    click_button "Show picture"
    assert_selector "#read-aloud-picture", text: "🎩"
  end

  test "curated lessons have complete explicit sound groups and progressive banks" do
    visit read_aloud_url
    lessons = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/read_aloud_lessons").then(({ LESSONS, SOUNDS }) => {
        done(Object.fromEntries(Object.entries(LESSONS).map(([id, lesson]) => [
          id, {
            count: lesson.entries.length,
            unique: new Set(lesson.entries.map((entry) => entry.text)).size,
            phonics: lesson.phonics,
            valid: lesson.entries.every((entry) =>
              entry.text && entry.emoji && entry.clue &&
              (id !== "beginner" || /^[a-z]{3}$/.test(entry.text)) &&
              (id !== "easy" || /^[a-z]{6}$/.test(entry.text)) &&
              (id !== "medium" || /^[a-z]{7,8}$/.test(entry.text)) &&
              entry.units.map((unit) => unit.letters).join(id === "sentences" ? " " : "") === entry.text &&
              entry.units.every((unit) => !lesson.phonics || unit.sound === null || SOUNDS[unit.sound]) &&
              (!lesson.phonics || entry.units.filter((unit) => unit.sound === null).every((unit, index, silent) =>
                silent.length === 1 && unit.letters === "e" && id === "silent_e"
              )) &&
              (!entry.family || entry.text.endsWith(entry.family))
            )
          }
        ])));
      }).catch((error) => done({ error: error.message }));
    JS
    expected = { "beginner" => 34, "families" => 26, "blends" => 22, "digraphs" => 22, "silent_e" => 22, "sentences" => 20, "easy" => 50, "medium" => 50 }
    assert_equal expected.keys.sort, lessons.keys.sort
    expected.each do |id, count|
      assert_equal count, lessons.fetch(id).fetch("count"), id
      assert_equal count, lessons.fetch(id).fetch("unique"), id
      assert lessons.fetch(id).fetch("valid"), id
    end
  end

  test "all eighty added readings can be completed and shared vocabulary stays unchanged" do
    visit read_aloud_url
    stub_speech
    results = page.evaluate_script(<<~JS)
      (() => {
        const controller = #{controller_script};
        const results = [];
        for (const level of ["beginner", "families", "blends", "digraphs", "silent_e", "sentences", "easy", "medium"]) {
          controller.level = level;
          controller.hintedWords = new Set();
          controller.mode = controller.lesson.phonics ? "build" : "read";
          for (let index = controller.words.length - 10; index < controller.words.length; index++) {
            controller.index = index;
            controller.showWord();
            controller.soundOut();
            const speech = window.readingSpeech.queue.map((utterance) => utterance.text);
            if (controller.lesson.phonics) {
              controller.hintBuilt();
              for (const unit of controller.currentEntry.units.slice(controller.selectedTiles.length)) {
                const tile = controller.bank.findIndex((letters, index) =>
                  letters === unit.letters && !controller.selectedTiles.includes(index));
                controller.selectedTiles.push(tile);
              }
              controller.renderBuilder();
              controller.checkBuilt();
            } else {
              controller.typedTarget.value = controller.currentWord;
              controller.checkTyped({ preventDefault() {} });
            }
            results.push({
              level, text: controller.currentWord, completed: controller.resolved,
              blend: speech[speech.length - 1]
            });
          }
        }
        controller.clearTimers();
        return results;
      })()
    JS
    assert_equal 80, results.length
    results.group_by { |result| result.fetch("level") }.each_value do |entries|
      assert_equal 10, entries.length
      entries.each do |entry|
        assert entry.fetch("completed"), entry.fetch("text")
        assert_equal entry.fetch("text"), entry.fetch("blend")
      end
    end
    shared_counts = page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      import("data/new_dolch_words").then(({default: banks}) =>
        done(Object.fromEntries(Object.entries(banks).map(([level, entries]) => [level, entries.length])))
      ).catch((error) => done({error: error.message}));
    JS
    assert_equal({ "beginner" => 24, "easy" => 40, "medium" => 40 }, shared_counts)
  end

  test "word families highlight the changing letter and keep their ending" do
    visit read_aloud_url
    click_button "Word families"
    assert_text "WORD 1 OF 26"
    assert_selector "[data-read-aloud-target='word'] .is-changing", text: "c"
    assert_selector ".read-aloud-family-word", count: 4
    click_button "Practice mat"
    assert_selector "[data-read-aloud-target='word']", text: "mat", exact_text: true
    assert_selector "[data-read-aloud-target='word'] .is-changing", text: "m"
    assert_selector ".read-aloud-family-word[aria-pressed='true']", text: "mat"
    click_button "I practiced reading"
    assert_text "1 practiced"
    assert_text "WORD 4 OF 26", wait: 3
  end

  test "building supports wrong guesses tile returns digraphs and silent e" do
    visit read_aloud_url
    click_button "Build from sounds"
    assert_no_selector "[data-read-aloud-target='word']"
    assert_selector "[data-read-aloud-target='slots'] button", count: 3
    assert_button "Check my word", disabled: true
    %w[a b d].each { |letters| click_button "Add #{letters}", exact: true }
    click_button "Check my word"
    assert_text "Keep trying!"
    assert_text "WORD 1 OF 34"
    click_button "Return a from group 1"
    assert_button "Add a", disabled: false
    click_button "A little hint"
    assert_button "Return b from group 1"
    assert_button "Return e from group 2"
    assert_button "Add b", disabled: true
    click_button "Add d", exact: true
    click_button "Check my word"
    assert_text "Yes! bed is right."
    assert_text "WORD 2 OF 34", wait: 3

    click_button "Two-letter sounds"
    assert_selector "[data-read-aloud-target='slots'] button", count: 3
    assert_button "Add sh"
    %w[sh i p].each { |letters| click_button "Add #{letters}", exact: true }
    click_button "Check my word"
    assert_text "Yes! ship is right."

    click_button "Silent e"
    assert_selector "[data-read-aloud-target='slots'] button", count: 4
    %w[c a p e].each { |letters| click_button "Add #{letters}", exact: true }
    click_button "Check my word"
    assert_text "Yes! cape is right."
  end

  test "repeated letter tiles are distinct and hints never reuse a tile" do
    visit read_aloud_url
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.words[0] = {
        text: "pep", emoji: "🌟", clue: "Energy!",
        units: [{letters: "p", sound: "p"}, {letters: "e", sound: "e"}, {letters: "p", sound: "p"}]
      };
    JS
    click_button "Build from sounds"
    assert_selector "[data-read-aloud-target='tiles'] button[aria-label='Add p']", count: 2
    first("[data-read-aloud-target='tiles'] button[aria-label='Add p']").click
    click_button "Add e", exact: true
    click_button "Add a", exact: true
    click_button "A little hint"
    assert_selector "[data-read-aloud-target='slots'] button", text: "p", count: 2
    assert_selector "[data-read-aloud-target='tiles'] button[aria-label='Add p']:disabled", count: 2
    assert_equal 3, page.evaluate_script("(new Set(#{controller_script}.selectedTiles)).size")
    click_button "Check my word"
    assert_text "Yes! pep is right."
  end

  test "guided audio highlights digraphs and silent e without speaking the final e" do
    visit read_aloud_url
    stub_speech
    click_button "Two-letter sounds"
    click_button "Hear & blend"
    assert_equal [ "shh", "ih", "puh", "ship" ], speech_texts
    page.execute_script("window.readingSpeech.queue[0].onstart()")
    assert_selector "[data-read-aloud-target='word'] [data-unit='0'].is-speaking", text: "sh"
    assert_selector "[data-read-aloud-target='word'] .is-speaking", count: 1
    page.execute_script("window.readingSpeech.queue[0].onend()")
    assert_no_selector ".is-speaking"

    click_button "Silent e"
    click_button "Hear & blend"
    assert_equal [ "kuh", "ay", "puh", "cape" ], speech_texts
    assert_text "cap → cape"
    page.execute_script("window.readingSpeech.queue[1].onstart()")
    assert_selector "[data-read-aloud-target='word'] [data-unit='1'].is-speaking"
    assert_selector "[data-read-aloud-target='word'] [data-unit='3'].is-speaking.is-silent"
    page.execute_script("window.readingSpeech.queue[3].onstart()")
    assert_text "Blend the sounds into the word"
    page.execute_script("window.readingSpeech.queue[3].onend()")
    assert_text "Your turn to read!"
    assert_no_selector ".is-speaking"
  end

  test "changing activities cancels playback and pending advancement" do
    visit read_aloud_url
    stub_speech
    click_button "Hear & blend"
    page.execute_script("window.oldSpeech = window.readingSpeech.queue[0]")
    click_button "Blends"
    page.execute_script("window.oldSpeech.onstart()")
    assert_no_selector ".is-speaking"
    assert_text "WORD 1 OF 22"
    click_button "I practiced reading"
    click_button "Build from sounds"
    assert_text "WORD 1 OF 22"
    assert_selector "[data-read-aloud-target='slots'] button", count: 4
    # Wait beyond the old advancement delay to prove it was canceled.
    page.evaluate_async_script("const done = arguments[0]; setTimeout(() => done(true), 1600)")
    assert_text "WORD 1 OF 22"
    assert_equal [], speech_texts
  end

  test "reconnecting resets the selected controls and ignores old speech callbacks" do
    visit read_aloud_url
    stub_speech
    click_button "Silent e"
    click_button "Hear & blend"
    page.execute_script(<<~JS)
      window.oldSpeech = window.readingSpeech.queue[1];
      const controller = #{controller_script};
      controller.disconnect();
      controller.connect();
    JS
    assert_selector "[data-level='beginner'][aria-pressed='true']"
    assert_selector "[data-mode='read'][aria-pressed='true']"
    assert_text "WORD 1 OF 34"
    click_button "Hear & blend"
    page.execute_script("window.oldSpeech.onstart()")
    assert_no_selector ".is-speaking"
    page.execute_script("window.readingSpeech.queue[0].onstart()")
    assert_selector "[data-read-aloud-target='word'] .is-speaking", text: "b"
  end

  test "repeated building misses offer a sound hint without losing practice" do
    visit read_aloud_url
    stub_speech
    click_button "Build from sounds"
    %w[a b d].each { |letters| find_button("Add #{letters}", exact: true).send_keys(:enter) }
    click_button "Check my word"
    click_button "Check my word"
    assert_text "Try b in group 1."
    assert_button "A little hint", disabled: true
    assert_button "Return b from group 1"
    assert_text "WORD 1 OF 34"
    assert_text "0 practiced"
    assert_equal [ "buh", "eh", "duh", "bed" ], speech_texts
    page.execute_script("window.readingSpeech.queue[0].onstart()")
    assert_selector "[data-read-aloud-target='slots'] [data-unit='0'].is-speaking"
    click_button "Add e", exact: true
    assert_selector "[data-read-aloud-target='slots'] [data-unit='0'].is-speaking"
  end

  test "one building hint is shared with automatic hints and survives activity switching" do
    visit read_aloud_url
    stub_speech
    click_button "Build from sounds"
    click_button "A little hint"
    assert_button "A little hint", disabled: true
    click_button "Add a", exact: true
    click_button "Add d", exact: true
    click_button "Check my word"
    click_button "Check my word"
    assert_text "You've used your one hint"
    assert_button "Return a from group 2"
    before = page.evaluate_script("#{controller_script}.selectedTiles")
    page.execute_script("#{controller_script}.hintBuilt()")
    assert_equal before, page.evaluate_script("#{controller_script}.selectedTiles")
    click_button "Read together"
    click_button "Build from sounds"
    assert_button "A little hint", disabled: true
    %w[b e d].each { |letters| click_button "Add #{letters}", exact: true }
    click_button "Check my word"
    assert_text "WORD 2 OF 34", wait: 3
    assert_button "A little hint", disabled: false

    click_button "Word families"
    click_button "A little hint"
    click_button "Read together"
    click_button "Practice hat"
    click_button "Practice cat"
    click_button "Build from sounds"
    assert_button "A little hint", disabled: true
    page.execute_script("#{controller_script}.restart()")
    assert_button "A little hint", disabled: false
  end

  test "phrases and sentences read word by word and preserve word boundaries" do
    visit read_aloud_url
    stub_speech
    click_button "Phrases & sentences"
    assert_text "READING 1 OF 20"
    assert_button "Build from sounds", disabled: true
    assert_selector "[data-read-aloud-target='word']", text: "a red hat", exact_text: true
    click_button "Hear & blend"
    assert_equal [ "a", "red", "hat", "a red hat" ], speech_texts
    page.execute_script("window.readingSpeech.queue[1].onstart()")
    assert_selector "[data-read-aloud-target='word'] .is-speaking", text: "red"
    fill_in "read-aloud-typed-input", with: "aredhat"
    click_button "Check", exact: true
    assert_text "Keep trying!"
    assert_text "READING 1 OF 20"
    fill_in "read-aloud-typed-input", with: " A   RED HAT! "
    click_button "Check", exact: true
    assert_text "Yes! a red hat is right."
    assert_text "READING 2 OF 20", wait: 3
    click_button "Easy words"
    click_button "Hear & blend"
    assert_equal [ "animal", "animal" ], speech_texts
    assert_selector "[data-read-aloud-target='letters'] button", count: 1
  end

  test "microphone mismatches encourage practice without marking an answer wrong" do
    visit read_aloud_url
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.RecognitionClass = class {
        start() { window.readingRecognition = this; this.onstart(); }
        abort() {}
      };
      controller.micTarget.disabled = false;
    JS
    click_button "Say it"
    page.execute_script("window.readingRecognition.onresult({results: [[{transcript: 'bad'}]]})")
    assert_text "The microphone may have heard differently."
    assert_text "WORD 1 OF 34"
    assert_text "0 practiced"
    assert_no_selector ".is-shake"
    click_button "I practiced reading"
    click_button "I practiced reading"
    assert_text "WORD 2 OF 34", wait: 3
    assert_text "1 practiced"
    click_button "Say it"
    page.execute_script("window.readingRecognition.onresult({results: [[{transcript: 'BUG!'}]]})")
    assert_text "Yes! bug is right."
    assert_text "WORD 3 OF 34", wait: 3
  end

  test "speech errors are visible and practice remains possible without audio" do
    visit read_aloud_url
    stub_speech
    click_button "Hear & blend"
    page.execute_script("window.readingSpeech.queue[0].onerror({error: 'synthesis-unavailable'})")
    assert_text "Audio couldn't play."
    assert_no_selector ".is-speaking"

    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.RecognitionClass = class {
        start() { throw new Error("Microphone unavailable"); }
        abort() {}
      };
      controller.micTarget.disabled = false;
    JS
    click_button "Say it"
    assert_text "The microphone couldn't start."
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.disconnect();
      Object.defineProperty(window, "SpeechSynthesisUtterance", {configurable: true, value: undefined});
      Object.defineProperty(window, "speechSynthesis", {configurable: true, value: undefined});
      controller.connect();
    JS
    assert_text "Audio is not available in this browser."
    assert_button "Hear the reading", disabled: true
    assert_button "Hear & blend", disabled: true
    click_button "Build from sounds"
    %w[b e d].each { |letters| click_button "Add #{letters}", exact: true }
    click_button "Check my word"
    assert_text "Yes! bed is right."
  end

  test "finishing and restarting preserve the activity and mobile controls fit" do
    visit read_aloud_url
    page.current_window.resize_to(375, 812)
    click_button "Silent e"
    click_button "Build from sounds"
    page.execute_script(<<~JS)
      const controller = #{controller_script};
      controller.index = controller.words.length - 1;
      controller.showWord();
    JS
    %w[t u b e].each { |letters| click_button "Add #{letters}", exact: true }
    click_button "Check my word"
    assert_text "ALL 22 READINGS PRACTICED", wait: 3
    click_button "Read them again"
    assert_text "WORD 1 OF 22"
    assert_selector "[data-mode='build'][aria-pressed='true']"
    assert_text "0 practiced"
    assert page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")
    click_button "Phrases & sentences"
    assert_selector "[data-mode='read'][aria-pressed='true']"
    assert_no_selector "[data-read-aloud-target='builder']"
    assert page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")
  ensure
    page.current_window.resize_to(1400, 1400)
  end

  private

  def controller_script
    'window.Stimulus.getControllerForElementAndIdentifier(document.querySelector("[data-controller=\'read-aloud\']"), "read-aloud")'
  end

  def stub_speech
    page.execute_script(<<~JS)
      window.readingSpeech = {
        queue: [],
        cancel() { this.queue = []; },
        speak(utterance) { this.queue.push(utterance); }
      };
      Object.defineProperty(window, "speechSynthesis", {configurable: true, value: window.readingSpeech});
    JS
  end

  def speech_texts
    page.evaluate_script("window.readingSpeech.queue.map((utterance) => utterance.text)")
  end
end
