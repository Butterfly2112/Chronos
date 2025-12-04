import axios from "axios";
import AppError from "../utils/AppError.js";

class CacheWithTTL {
  constructor(ttlMs = 24 * 60 * 60 * 1000) {
    // 24 години за замовчуванням
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

class RegionCalendarService {
  constructor() {
    this.baseUrl = "https://www.googleapis.com/calendar/v3/calendars";
    this.cache = new CacheWithTTL();

    this.calendarMap = {
      au: "australian",
      at: "austrian",
      br: "brazilian",
      bg: "bulgarian",
      ca: "canadian",
      cn: "china",
      hr: "croatian",
      cz: "czech",
      dk: "danish",
      fi: "finnish",
      fr: "french",
      de: "german",
      gb: "uk",
      gr: "greek",
      hk: "hong_kong",
      hu: "hungarian",
      in: "indian",
      id: "indonesian",
      ie: "irish",
      il: "jewish",
      it: "italian",
      jp: "japanese",
      lv: "latvian",
      lt: "lithuanian",
      my: "malaysia",
      mx: "mexican",
      nl: "dutch",
      nz: "new_zealand",
      no: "norwegian",
      ph: "philippines",
      pl: "polish",
      pt: "portuguese",
      ro: "romanian",
      sa: "saudiarabian",
      sg: "singapore",
      sk: "slovak",
      si: "slovenian",
      kr: "south_korea",
      es: "spain",
      se: "swedish",
      tw: "taiwan",
      tl: "thai",
      tr: "turkish",
      ua: "ukrainian",
      Ukraine: "ukrainian",
      us: "usa",
      vn: "vietnamese",
    };
  }

  /**
   * Отримати API ключ тоді (lazy loading)
   */
  #getApiKey() {
    if (!process.env.GOOGLE_API_KEY) {
      console.warn(
        "Google API key is not configured - regional calendars disabled"
      );
      return null;
    }

    return process.env.GOOGLE_API_KEY;
  }

  isRegionalCalendarId(calendarId) {
    if (!calendarId) return false;
    return String(calendarId).startsWith("google_");
  }

  isRegionalEventId(eventId) {
    if (!eventId) return false;
    return String(eventId).startsWith('system_holiday_');
  }

  extractCountryCode(id) {
    if (!id) return null;

    if (this.isRegionalCalendarId(id)) {
      const parts = String(id).split("_");
      return parts[1] || null;
    }

    if (this.isRegionalEventId(id)) {
      const parts = String(id).split("_");
      return parts[2] || null;
    }

    return null;
  }

  #normalizeCountryCode(countryCode) {
    if (!countryCode) {
      throw new AppError("Country code is required", 400);
    }

    const normalized = countryCode.toLowerCase().trim();

    if (normalized === "ukraine") return "ua";

    return normalized;
  }

  #getCalendarId(countryCode) {
    const normalized = this.#normalizeCountryCode(countryCode);
    const countryName = this.calendarMap[normalized];

    if (!countryName) {
      throw new AppError(`Country "${countryCode}" is not supported`, 400);
    }

    return `en.${countryName}#holiday@group.v.calendar.google.com`;
  }

  #getCountryDisplayName(countryCode) {
    const names = {
      au: "Australia",
      at: "Austria",
      br: "Brazil",
      bg: "Bulgaria",
      ca: "Canada",
      cn: "China",
      hr: "Croatia",
      cz: "Czech Republic",
      dk: "Denmark",
      fi: "Finland",
      fr: "France",
      de: "Germany",
      gb: "United Kingdom",
      gr: "Greece",
      hk: "Hong Kong",
      hu: "Hungary",
      in: "India",
      id: "Indonesia",
      ie: "Ireland",
      il: "Israel",
      it: "Italy",
      jp: "Japan",
      lv: "Latvia",
      lt: "Lithuania",
      my: "Malaysia",
      mx: "Mexico",
      nl: "Netherlands",
      nz: "New Zealand",
      no: "Norway",
      ph: "Philippines",
      pl: "Poland",
      pt: "Portugal",
      ro: "Romania",
      sa: "Saudi Arabia",
      sg: "Singapore",
      sk: "Slovakia",
      si: "Slovenia",
      kr: "South Korea",
      es: "Spain",
      se: "Sweden",
      tw: "Taiwan",
      tl: "Thailand",
      tr: "Turkey",
      ua: "Ukraine",
      Ukraine: "Ukraine",
      us: "United States",
      vn: "Vietnam",
    };

    return names[countryCode] || countryCode.toUpperCase();
  }

  async getRegionCalendar(countryCode, year = null) {
    const normalized = this.#normalizeCountryCode(countryCode);
    const targetYear = year || new Date().getFullYear();
    const cacheKey = `google_${normalized}_${targetYear}_extended`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(
        `Serving holidays for ${normalized} (${targetYear}) from cache`
      );
      return cached;
    }

    const apiKey = this.#getApiKey();
    if (!apiKey) {
      console.warn(
        "Google API key is not configured - regional calendars disabled"
      );
      return null;
    }

    const calendarId = this.#getCalendarId(normalized);
    const encodedCalendarId = encodeURIComponent(calendarId);

    try {
      console.log(
        `Fetching holidays for ${normalized} (${targetYear} + ${
          targetYear + 1
        }) from Google...`
      );

      const currentYearResponse = await axios.get(
        `${this.baseUrl}/${encodedCalendarId}/events`,
        {
          params: {
            key: apiKey,
            timeMin: `${targetYear}-01-01T00:00:00Z`,
            timeMax: `${targetYear}-12-31T23:59:59Z`,
            orderBy: "startTime",
            singleEvents: true,
            maxResults: 250,
          },
          timeout: 10000,
        }
      );

      const nextYearResponse = await axios.get(
        `${this.baseUrl}/${encodedCalendarId}/events`,
        {
          params: {
            key: apiKey,
            timeMin: `${targetYear + 1}-01-01T00:00:00Z`,
            timeMax: `${targetYear + 1}-12-31T23:59:59Z`,
            orderBy: "startTime",
            singleEvents: true,
            maxResults: 250,
          },
          timeout: 10000,
        }
      );

      const currentYearEvents = currentYearResponse.data.items.map((event) => {
        const isAllDay = !!event.start.date;
        const startDate = isAllDay ? event.start.date : event.start.dateTime;
        const endDate = isAllDay ? event.end.date : event.end.dateTime;

        return {
          _id: `system_holiday_${normalized}_${event.id}`,
          title: event.summary,
          description: "Public Holiday",
          startDate: startDate,
          endDate: endDate,
          allDay: isAllDay,
          type: "holiday",
          creator: null,
          calendar: `google_${normalized}_${targetYear}`,
          invited: [],
          status: "done",
          repeat: "none",
        };
      });

      const nextYearEvents = nextYearResponse.data.items.map((event) => {
        const isAllDay = !!event.start.date;
        const startDate = isAllDay ? event.start.date : event.start.dateTime;
        const endDate = isAllDay ? event.end.date : event.end.dateTime;

        return {
          _id: `system_holiday_${normalized}_${event.id}_${targetYear + 1}`,
          title: event.summary,
          description: "Public Holiday",
          startDate: startDate,
          endDate: endDate,
          allDay: isAllDay,
          type: "holiday",
          creator: null,
          calendar: `google_${normalized}_${targetYear}`,
          invited: [],
          status: "done",
          repeat: "none",
        };
      });

      const allEvents = [...currentYearEvents, ...nextYearEvents];

      const virtualCalendar = {
        _id: `google_${normalized}_${targetYear}`,
        name: `${this.#getCountryDisplayName(normalized)} Holidays`,
        description: `Public holidays for ${this.#getCountryDisplayName(
          normalized
        )} (${targetYear}-${targetYear + 1})`,
        owner: null,
        isDefault: false,
        isRegional: true,
        color: "#FF6B6B",
        events: allEvents,
        sharedWith: [],
      };

      this.cache.set(cacheKey, virtualCalendar);
      console.log(
        `Cached ${allEvents.length} holidays for ${normalized} (${targetYear}-${
          targetYear + 1
        })`
      );

      return virtualCalendar;
    } catch (error) {
      console.error(
        `Failed to fetch regional calendar for ${normalized}:`,
        error.message
      );
      return null;
    }
  }

  async getEventById(eventId) {
    const parts = String(eventId).split("_");

    if (parts.length < 4 || parts[0] !== "system" || parts[1] !== "holiday") {
      throw new AppError("Invalid regional event ID format", 400);
    }

    const countryCode = parts[2];
    const googleEventId = parts.slice(3).join("_");

    try {
      const currentYear = new Date().getFullYear();
      const calendar = await this.getRegionCalendar(countryCode, currentYear);

      if (calendar) {
        const event = calendar.events.find((evt) => evt._id === eventId);
        if (event) return event;
      }

      for (const year of [currentYear - 1, currentYear + 1]) {
        const cal = await this.getRegionCalendar(countryCode, year);
        if (cal) {
          const evt = cal.events.find((e) => e._id === eventId);
          if (evt) return evt;
        }
      }

      const calendarId = this.#getCalendarId(countryCode);
      const encodedCalendarId = encodeURIComponent(calendarId);

      const response = await axios.get(
        `${this.baseUrl}/${encodedCalendarId}/events/${googleEventId}`,
        {
          params: { key: this.#getApiKey() },
          timeout: 5000,
        }
      );

      const data = response.data;
      const isAllDay = !!data.start.date;
      const normalized = this.#normalizeCountryCode(countryCode);

      return {
        _id: eventId,
        title: data.summary,
        description: "Public Holiday",
        startDate: isAllDay ? data.start.date : data.start.dateTime,
        endDate: isAllDay ? data.end.date : data.end.dateTime,
        allDay: isAllDay,
        type: "holiday",
        color: "#FF6B6B",
        creator: null,
        calendar: `google_${normalized}_${new Date().getFullYear()}`,
        invited: [],
        status: "done",
        repeat: "none",
      };
    } catch (error) {
      console.error("Failed to fetch regional event:", error.message);
      throw new AppError("Event not found in regional calendar", 404);
    }
  }

  async getCalendarEvents(calendarId) {
    if (!this.isRegionalCalendarId(calendarId)) {
      throw new AppError("Not a regional calendar ID", 400);
    }

    const countryCode = this.extractCountryCode(calendarId);
    if (!countryCode) {
      throw new AppError("Invalid regional calendar ID", 400);
    }

    const parts = String(calendarId).split("_");
    const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();

    const calendar = await this.getRegionCalendar(countryCode, year);
    return calendar ? calendar.events : [];
  }

  clearCache() {
    this.cache.clear();
    console.log("Regional calendar cache cleared");
  }
}

export default RegionCalendarService;
