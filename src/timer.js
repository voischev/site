onmessage = function(event) {
    const MINUTE = 1000 * 60
    let countdown = event.data

    postMessage(countdown)

    setTimeout(function run() {

        countdown--

        postMessage(countdown)

        if (countdown === 0) {
            return
        }

        setTimeout(run, MINUTE)
    }, MINUTE)
}
