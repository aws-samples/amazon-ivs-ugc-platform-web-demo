export async function getDevices() {
    // The following line prevents issues on Safari/FF WRT to device selects
    // and ensures the device labels are not blank
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    if (!videoDevices.length) {
        console.warn('No video devices found.');
    }
    const audioDevices = devices.filter((d) => d.kind === 'audioinput');
    if (!audioDevices.length) {
        console.warn('No audio devices found.');
    }

    return { videoDevices, audioDevices };
}

export async function getCamera(deviceId) {
    let media;
    const videoConstraints = {
        deviceId: deviceId ? { exact: deviceId } : null,
    };
    media = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
    });
    return media.getTracks()[0];
}

export async function getMic(deviceId) {
    let media;
    const audioConstraints = {
        deviceId: deviceId ? { exact: deviceId } : null,
    };
    media = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: audioConstraints,
    });
    return media.getTracks()[0];
}

export async function getScreenshare() {
    // TODO: Constraints?
    return navigator.mediaDevices.getDisplayMedia();
}
