// Generate a RFC4122 version 4 UUID (random)
export function generateUUIDv4(): string {
    // Generates something like 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0; // random 0-15
        const v = c === 'x' ? r : (r & 0x3) | 0x8; // See RFC spec
        return v.toString(16);
    });
}
