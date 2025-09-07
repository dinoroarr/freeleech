import trackerInfo from "./trackers.json" with { type: "json" };
import * as rrulePkg from "rrule"
import * as DateFNS from "date-fns"
import { TZDate } from "@date-fns/tz"
import _ from "lodash";
import humanizeDuration from "humanize-duration"

const RRule = rrulePkg.default.RRule;

export function generateReadme() {
  const infoPerTracker = getFreeleechPerTracker()

  let output = "";
  output += `
# Torrent Tracker Freeleech Status

A list of torrent trackers and their freeleech status.

This list is automatically generated, updated every hour, last updated at ${new Date().toUTCString()} (UTC).

| Tracker | Currently Freelech? | When Freelech? | Min. Seeding Time |
|---------|---------------------|----------------|-------------------|
`

  for (const [trackerCode, freeleechInfo] of _.sortBy(Object.entries(infoPerTracker), ([trackerCode, _]) => trackerCode)) {
    if (freeleechInfo === undefined) {
      continue
    }

    const tracker = trackerInfo.trackers.find(t => t.code === trackerCode);
    const isFreeleech = checkIsCurrentlyFreeleech(freeleechInfo);
    const whenFreeleech = getNextFreeleechTime(freeleechInfo);
    const durationStr = tracker.minSeedingTime === undefined ? "Unknown" : tracker.minSeedingTime === 0 ? "No min. seeding" : humanizeDuration(tracker.minSeedingTime * 1000, {units: ["d", "h", "m", "s"]});

    output += `| [${tracker.name}](${tracker.domain}) | ${isFreeleech ? "✅ Yes" : "❌ No"} | ${whenFreeleech} | ${durationStr} |\n`
  }

  output += `
## Notes

- All times are in UTC unless otherwise specified.
- "Freeleech" means that downloading torrents from the tracker does not count against your download ratio.
- The information in this list may not be accurate. Always check the tracker's website for the most up-to-date information.
- We are not affiliated with any of the trackers listed here. Use at your own risk.
- If you notice any inaccuracies, please open an issue or a pull request!
`

  console.log(output);
}

function getFreeleechPerTracker() {
  let infoPerTracker = {}

  for (const info of trackerInfo.freeleech) {
    infoPerTracker[info.tracker] = [
      ...(infoPerTracker[info.tracker] || []),
      info
    ]
  }

  // Remove expired one-time freeleech
  infoPerTracker = Object.entries(infoPerTracker).reduce((acc, [tracker, infos]) => {
    acc[tracker] = infos.filter(info => {
      if (info.type !== "one-time") {
        return true
      }

      const [_, end] = info.time.split("/")
      const timezone = info.timeZone || "UTC";

      const endDate = new TZDate(new Date(end), timezone);

      return DateFNS.isAfter(endDate, new Date())
    })
    return acc
  }, {})

  // Remove permanent freeleech
  infoPerTracker = Object.entries(infoPerTracker).reduce((acc, [tracker, infos]) => {
    acc[tracker] = infos.filter(info => info.type !== "permanent")
    return acc
  }, {})


  // Make sure only one one-time freeleech per tracker
  infoPerTracker = Object.entries(infoPerTracker).reduce((acc, [tracker, infos]) => {
    const oneTimeInfos = infos.filter(info => info.type === "one-time")

    if (oneTimeInfos.length === 0) {
      acc[tracker] = infos
    } else if (oneTimeInfos.length === 1) {
      acc[tracker] = infos
    } else {
      // There's more than one one-time freeleech, keep only the first one
      const sortedFreeleech = _.sortBy(oneTimeInfos, [info => {
        const [start, _] = info.time.split("/")
        const timezone = info.timeZone || "UTC";

        return new TZDate(new Date(start), timezone);
      }])

      acc[tracker] = [
        sortedFreeleech[0],
        ...infos.filter(info => info.type !== "one-time")
      ]
    }

    return acc
  }, {})

  // Sort by type: one-time, recurring, permanent
  infoPerTracker = Object.entries(infoPerTracker).reduce((acc, [tracker, infos]) => {
    acc[tracker] = _.sortBy(infos, [info => {
      if (info.type === "one-time") {
        return 0
      }
      if (info.type === "recurring") {
        return 1
      }
      if (info.type === "permanent") {
        return 2
      }
      return 3
    }])[0]

    return acc
  }, {})

  return infoPerTracker
}

function checkIsCurrentlyFreeleech(info) {
  switch (info.type) {
    case "permanent": {
      return true;
    }
    case "recurring": {
      const startOfHour = DateFNS.startOfHour(new Date());
      const endOfHour = DateFNS.endOfHour(new Date());

      const rruleConverted = RRule.fromString(info.rrule);
      const rrule = new RRule({
        ...rruleConverted.options,
        dtstart: startOfHour,
        tzid: info.timeZone || "UTC",
        interval: 50,
      });

      return rrule.between(startOfHour, endOfHour).length > 0;
    }
    case "one-time": {
      const [start, end] = info.time.split("/")

      return DateFNS.isWithinInterval(new Date(), {
        start: new Date(start),
        end: new Date(end),
      });
    }
  }

  throw new Error(`Unknown freeleech type: ${info.type}`);
}

function getNextFreeleechTime(info) {
  switch (info.type) {
    case "permanent": {
      return "Permanent";
    }
    case "recurring": {
      return info.description
    }
    case "one-time": {
      const [start, end] = info.time.split("/")

      const startDate = createDate(start, info.timeZone || "UTC");
      const endDate = createDate(end, info.timeZone || "UTC");

      const startStr = startDate.toUTCString().replace("GMT", "UTC");
      const endStr = endDate.toUTCString().replace("GMT", "UTC");

      return `From ${startStr} to ${endStr}`;
    }
  }

  throw new Error(`Unknown freeleech type: ${info.type}`);
}

function createDate(dateStr, timeZone) {
  // date-fns does not allow initializing a string date with a timezone directly
  const [datePart, timePart] = dateStr.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new TZDate(year, month - 1, day, hour, minute, second, timeZone);
}

