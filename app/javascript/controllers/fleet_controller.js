import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static targets = ["identity", "invitation", "link", "copyStatus", "status", "connection", "error", "sound", "settings", "boards", "ownPanel", "opponentPanel", "setup", "shuffle", "ready", "lastMove", "sunkNotice", "own", "opponent"]
  static values = { token: String, stateUrl: String, readyUrl: String, shuffleUrl: String, fireUrl: String }

  connect() {
    this.active = true
    this.pending = false
    this.soundEnabled = false
    this.unavailable = false
    this.snapshot = null
    this.playing = null
    this.mobile = matchMedia("(max-width: 800px)")
    this.onLayoutChange = () => {
      this.settingsTarget.open = !this.mobile.matches
      this.ownPanelTarget.open = !this.mobile.matches || !this.playing
    }
    this.mobile.addEventListener("change", this.onLayoutChange)
    this.onLayoutChange()
    this.abort = new AbortController()
    this.connectionTimeout = setTimeout(() => {
      if (this.active) this.connectionTarget.textContent = "Live updates have not connected yet. Checking every 10 seconds; you can also refresh."
    }, 8000)
    this.consumer = createConsumer()
    this.subscription = this.consumer.subscriptions.create({ channel: "FleetGameChannel", token: this.tokenValue }, {
      connected: () => {
        clearTimeout(this.connectionTimeout)
        this.connectionTarget.textContent = "Live updates connected."
        this.refresh()
      },
      disconnected: () => {
        clearTimeout(this.connectionTimeout)
        this.connectionTarget.textContent = "Live connection interrupted. Checking every 10 seconds and reconnecting..."
      },
      rejected: () => {
        clearTimeout(this.connectionTimeout)
        this.connectionTarget.textContent = "Live connection unavailable. Checking every 10 seconds; you can also refresh."
        this.refresh()
      },
      received: () => this.refresh()
    })
    this.interval = setInterval(() => this.refresh(), 10000)
    this.onVisible = () => { if (!document.hidden) this.refresh() }
    document.addEventListener("visibilitychange", this.onVisible)
    this.refresh()
  }

  disconnect() {
    this.active = false
    clearInterval(this.interval)
    clearTimeout(this.connectionTimeout)
    this.mobile.removeEventListener("change", this.onLayoutChange)
    document.removeEventListener("visibilitychange", this.onVisible)
    this.abort.abort()
    this.consumer.disconnect()
    if (this.audio) this.audio.close().catch((error) => console.warn("Fleet Quest sound cleanup:", error))
    document.title = "Fleet Quest | Play together"
  }

  async request(url, body) {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
      const response = await fetch(url, {
        method: body === undefined ? "GET" : "POST",
        credentials: "same-origin", cache: "no-store", signal: this.abort.signal,
        headers: {
          Accept: "application/json", "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      })
      const data = await response.json()
      if ([403, 404, 410].includes(response.status) && this.active) {
        this.unavailable = true
        clearInterval(this.interval)
        this.connectionTarget.textContent = "This room is no longer available to this browser."
        if (this.snapshot) this.render()
      }
      if (!response.ok) throw new Error(data.error || "The game could not be updated. Refresh before trying again.")
      if (!this.active) return
      if (!this.snapshot || data.revision >= this.snapshot.revision) {
        this.errorTarget.textContent = ""
        this.applyState(data)
      }
    } catch (error) {
      if (!this.active && error.name === "AbortError") return
      console.error("Fleet Quest request:", error)
      if (this.active) this.errorTarget.textContent = `${error.message} Your move may not have reached the server. Refresh to check the current board.`
    }
  }

  refresh() {
    return this.request(this.stateUrlValue)
  }

  async move(url, body = {}) {
    if (this.pending || !this.snapshot) return
    this.pending = true
    this.render()
    await this.request(url, body)
    this.pending = false
    if (this.active && this.snapshot) this.render()
  }

  ready() {
    return this.move(this.readyUrlValue)
  }

  shuffle() {
    return this.move(this.shuffleUrlValue)
  }

  fire(event) {
    if (!this.myTurn()) return
    return this.move(this.fireUrlValue, { cell: Number(event.currentTarget.dataset.cell) })
  }

  myTurn() {
    return !this.unavailable && this.snapshot && this.snapshot.joined && this.snapshot.ready.every(Boolean) &&
      this.snapshot.winner === null && this.snapshot.turn === this.snapshot.player
  }

  applyState(data) {
    const wasMyTurn = this.myTurn()
    const previous = this.snapshot
    this.snapshot = data
    this.render()
    if (previous && !wasMyTurn && this.myTurn() && this.soundEnabled) this.chime()
  }

  render() {
    const state = this.snapshot
    const ownReady = state.ready[state.player - 1]
    const playing = state.joined && state.ready.every(Boolean)
    if (playing !== this.playing) {
      this.playing = playing
      if (playing) this.boardsTarget.prepend(this.opponentPanelTarget)
      else this.boardsTarget.prepend(this.ownPanelTarget)
      this.ownPanelTarget.open = !this.mobile.matches || !playing
    }
    this.identityTarget.textContent = `You are Player ${state.player}. Your fleet has ships of length 3, 2, and 2.`
    this.invitationTarget.hidden = state.joined
    this.setupTarget.hidden = ownReady || state.winner !== null
    this.readyTarget.disabled = this.pending || ownReady || this.unavailable
    this.shuffleTarget.disabled = this.pending || ownReady || this.unavailable
    const status = this.unavailable ? "Room unavailable. Create a new game to play together."
      : state.winner !== null
      ? (state.winner === state.player ? "You found the whole fleet! You win! Great exploring together." : "Your friend found your fleet! Thanks for playing together.")
      : !state.joined ? "Waiting for your friend to join. Share the invitation link."
      : !state.ready.every(Boolean) ? (ownReady ? "Your fleet is ready. Waiting for your friend to choose Ready." : "Choose your fleet, then press Ready to play.")
      : this.myTurn() ? "Your turn! Choose a square on your friend's ocean." : "Your friend's turn. Watch for your turn banner!"
    this.statusTarget.textContent = status
    this.statusTarget.classList.toggle("is-your-turn", Boolean(this.myTurn()))
    document.title = this.myTurn() ? "Your turn! | Fleet Quest" : "Fleet Quest | Play together"
    const last = state.incoming.at(-1)
    const outgoing = state.outgoing.at(-1)
    const describe = (shot) => `${this.coordinate(shot.cell)}, ${shot.hit ? (shot.sunk ? "ship sunk!" : "hit!") : "miss."}`
    this.lastMoveTarget.textContent = [
      outgoing ? `Your last move: ${describe(outgoing)}` : "",
      last ? `Your friend's last move: ${describe(last)}` : ""
    ].filter(Boolean).join(" ")
    const sunkOutgoing = state.outgoing.filter((shot) => shot.sunk).at(-1)
    const sunkIncoming = state.incoming.filter((shot) => shot.sunk).at(-1)
    const sunkMessage = [
      sunkOutgoing ? `Ship sunk! You sank your friend's ship with your shot at ${this.coordinate(sunkOutgoing.cell)}.` : "",
      sunkIncoming ? `Your friend sank one of your ships with their shot at ${this.coordinate(sunkIncoming.cell)}.` : ""
    ].filter(Boolean).join(" ")
    if (this.sunkNoticeTarget.textContent !== sunkMessage) this.sunkNoticeTarget.textContent = sunkMessage
    this.sunkNoticeTarget.classList.toggle("has-notice", Boolean(sunkMessage))
    const focused = document.activeElement?.dataset.fleetFocus
    this.drawBoard(this.ownTarget, state.incoming, state.fleet.flat(), true)
    this.drawBoard(this.opponentTarget, state.outgoing, [], false)
    if (focused) this.element.querySelector(`[data-fleet-focus="${focused}"]:not(:disabled)`)?.focus()
  }

  coordinate(cell) {
    return `${String.fromCharCode(65 + Math.floor(cell / this.snapshot.size))}${cell % this.snapshot.size + 1}`
  }

  drawBoard(board, shots, fleet, own) {
    const cells = Array.from({ length: this.snapshot.size ** 2 }, (_, cell) => {
      const shot = shots.find((entry) => entry.cell === cell)
      const ship = fleet.includes(cell)
      const square = document.createElement(own ? "span" : "button")
      const result = shot ? (shot.hit ? (shot.sunk ? "sunk ship" : "hit") : "miss") : ship ? "your ship" : "unexplored"
      const coordinate = this.coordinate(cell)
      square.className = `fleet-cell${ship ? " has-ship" : ""}${shot ? (shot.hit ? " is-hit" : " is-miss") : ""}${shot?.sunk ? " is-sunk" : ""}`
      square.textContent = `${coordinate}\n${shot ? (shot.hit ? "X" : "·") : ship ? "S" : "~"}`
      square.setAttribute("aria-label", `${coordinate}: ${result}`)
      if (own) {
        square.setAttribute("role", "img")
      } else {
        square.type = "button"
        square.dataset.cell = cell
        square.dataset.fleetFocus = `cell-${cell}`
        square.disabled = this.pending || !this.myTurn() || Boolean(shot)
        square.addEventListener("click", (event) => this.fire(event))
      }
      return square
    })
    board.replaceChildren(...cells)
  }

  async copyInvitation() {
    try {
      await navigator.clipboard.writeText(this.linkTarget.value)
      this.copyStatusTarget.textContent = "Invitation copied. Send it privately to your friend."
    } catch (error) {
      console.warn("Fleet Quest invitation copy:", error)
      this.linkTarget.select()
      this.copyStatusTarget.textContent = "Automatic copying is unavailable. Copy the selected link using your browser."
    }
  }

  async toggleSound() {
    if (this.soundEnabled) {
      this.soundEnabled = false
    } else {
      try {
        this.audio ||= new AudioContext()
        await this.audio.resume()
        this.soundEnabled = true
        this.chime()
      } catch (error) {
        console.warn("Fleet Quest sound:", error)
        this.errorTarget.textContent = "Turn sounds are unavailable in this browser. The turn banner and tab title still work."
      }
    }
    this.soundTarget.textContent = this.soundEnabled ? "Turn sounds on - turn off" : "Enable turn sounds"
    this.soundTarget.setAttribute("aria-pressed", String(this.soundEnabled))
  }

  chime() {
    if (this.audio.state !== "running") {
      this.errorTarget.textContent = "Turn sound is paused by your browser. Turn sounds off and on to enable it again."
      return
    }
    const oscillator = this.audio.createOscillator()
    const gain = this.audio.createGain()
    oscillator.frequency.value = 660
    gain.gain.setValueAtTime(0.08, this.audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.3)
    oscillator.connect(gain)
    gain.connect(this.audio.destination)
    oscillator.start()
    oscillator.stop(this.audio.currentTime + 0.3)
  }
}
