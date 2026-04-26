// Geolocation service for getting user's current position
export const geolocationService = {
  // Request user's current location
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMsg = "Unable to get your location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Location access denied. Please enable it in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Your position is currently unavailable.";
              break;
            case error.TIMEOUT:
              errorMsg = "The request to get your location timed out.";
              break;
            default:
              errorMsg = "An error occurred while retrieving your location.";
          }
          reject(new Error(errorMsg));
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0
        }
      );
    });
  },

  // Calculate distance between two coordinates (in km)
  calculateDistance: (coord1, coord2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLng = toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coord1.lat)) *
        Math.cos(toRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  },

  // Format coordinates for display
  formatCoordinates: (lat, lng) => {
    return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? "E" : "W"}`;
  }
};

export default geolocationService;
