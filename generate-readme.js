import trackerInfo from "./tracker-info.json" with { type: "json" };
import * as rrulePkg from "rrule"
import * as DateFNS from "date-fns"
import { TZDate } from "@date-fns/tz"
import _ from "lodash";

const RRule = rrulePkg.default.RRule;

export function generateReadme() {
  const infos = {};

  // Sort by tracker code
  for (const tracker of _.sortBy(_.values(trackerInfo.trackers), ["code"])) {
    const freeleeches = _.sortBy(
        trackerInfo.freeleech
          .filter(f => f.tracker === tracker.code)
          // Filter out all `one-time` freeleech that have already ended
          .filter(isFreeleechAlreadyPassed)
      // Sort by type
      , [object => {
        if (object.type === "permanent") {
          return new Date(0); // Always first
        }

        if (object.type === "recurring") {
          if (isFreeleechOngoing(object)) {
            return getStartOfCurrentRecurring(object);
          }

          return getNextStartOfRecurring(object);
        }

        if (object.type === "one-time") {
          if (isFreeleechOngoing(object)) {
            return getStartOfOneTime(object);
          }

          return getNextStartOfOneTime(object);
        }

        throw new Error(`Unknown freeleech type: ${object.type}`);
      }]);

    // At this point, there should be at most one freeleech per tracker
    infos[tracker.code] = freeleeches[0]
  }


  let output = "";
  output += `
# Torrent Tracker Freeleech Status

A list of torrent trackers and their freeleech status.

This list is automatically generated, updated every hour, last updated at ${new Date().toUTCString()} (UTC).

| Tracker | Currently Freelech? | When Freelech? |
|---------|---------------------|----------------|
`

  for (const [trackerCode, freeleechInfo] of Object.entries(infos)) {
    const tracker = trackerInfo.trackers.find(t => t.code === trackerCode);
    const isFreeleech = getIsFreeleech(freeleechInfo);
    const whenFreeleech = getWhenFreeleech(freeleechInfo);

    output += `| [${tracker.name}](${tracker.domain}) | ${isFreeleech ? "✅ Yes" : "❌ No"} | ${whenFreeleech} |\n`
  }

  output += `
## Notes

- "Freeleech" means that downloading torrents from the tracker does not count against your download ratio.
- The information in this list may not be accurate. Always check the tracker's website for the most up-to-date information.
- We are not affiliated with any of the trackers listed here. Use at your own risk.
- If you notice any inaccuracies, please open an issue or a pull request!
`

  console.log(output);
}

function getIsFreeleech(tracker) {
  switch (tracker.type) {
    case "permanent": {
      return true;
    }
    case "recurring": {
      const startOfHour = DateFNS.startOfHour(new Date());
      const endOfHour = DateFNS.endOfHour(new Date());

      const rruleConverted = RRule.fromText(tracker.rrule);
      const rrule = new RRule({
        ...rruleConverted.options,
        tzid: tracker.timezone || "UTC",
      });

      return rrule.between(startOfHour, endOfHour).length > 0;
    }
    case "one-time": {
      const [start, end] = tracker.time.split("/")

      return DateFNS.isWithinInterval(new Date(), {
        start: new Date(start),
        end: new Date(end),
      });
    }
  }
}

function getWhenFreeleech(tracker) {
  switch (tracker.type) {
    case "permanent": {
      return "Permanent";
    }
    case "recurring": {
      return tracker.rrule;
    }
    case "one-time": {
      const [start, end] = tracker.time.split("/")

      return `From ${new Date(start).toUTCString()} to ${new Date(end).toUTCString()} (UTC)`;
    }
  }
}

function isFreeleechAlreadyPassed(freeleechInfo) {
  if (freeleechInfo.type !== "one-time") {
    return true;
  }

  const [_, end] = freeleechInfo.time.split("/")
  const timezone = freeleechInfo.timezone || "UTC";

  const endDate = new TZDate(new Date(end), timezone);

  return !DateFNS.isBefore(endDate, new Date());
}

function getStartOfCurrentRecurring(freeleechInfo) {
  if (freeleechInfo.type !== "recurring") {
    return null;
  }

  const timezone = freeleechInfo.timezone || "UTC";
  const rruleConverted = RRule.fromText(freeleechInfo.rrule);
  const rrule = new RRule({
    ...rruleConverted.options,
    tzid: timezone,
  });

  return rrule.before(new Date(), true)[0];
}

function getNextStartOfRecurring(freeleechInfo) {
  if (freeleechInfo.type !== "recurring") {
    return null;
  }

  const timezone = freeleechInfo.timezone || "UTC";
  const rruleConverted = RRule.fromText(freeleechInfo.rrule);
  const rrule = new RRule({
    ...rruleConverted.options,
    tzid: timezone,
  });

  return rrule.after(new Date(), true)[0];
}

function getStartOfOneTime(freeleechInfo) {
  if (freeleechInfo.type !== "one-time") {
    return null;
  }

  const [start, _] = freeleechInfo.time.split("/")
  const timezone = freeleechInfo.timezone || "UTC";

  return new TZDate(new Date(start), timezone);
}

function getNextStartOfOneTime(freeleechInfo) {
  if (freeleechInfo.type !== "one-time") {
    return null;
  }

  const [start, _] = freeleechInfo.time.split("/")
  const timezone = freeleechInfo.timezone || "UTC";

  return new TZDate(new Date(start), timezone);
}

function isFreeleechOngoing(freeleechInfo) {
  if (freeleechInfo.type === "permanent") {
    return true;
  }

  if (freeleechInfo.type === "recurring") {
    const startOfHour = DateFNS.startOfHour(new Date());
    const endOfHour = DateFNS.endOfHour(new Date());

    const timezone = freeleechInfo.timezone || "UTC";
    const rruleConverted = RRule.fromText(freeleechInfo.rrule);
    const rrule = new RRule({
      ...rruleConverted.options,
      tzid: timezone,
    });

    return rrule.between(startOfHour, endOfHour).length > 0;
  }

  if (freeleechInfo.type === "one-time") {
    const [start, end] = freeleechInfo.time.split("/")
    const timezone = freeleechInfo.timezone || "UTC";

    const startDate = new TZDate(new Date(start), timezone);
    const endDate = new TZDate(new Date(end), timezone);

    return DateFNS.isWithinInterval(new Date(), {
      start: startDate,
      end: endDate,
    });
  }

  throw new Error(`Unknown freeleech type: ${freeleechInfo.type}`);
}
