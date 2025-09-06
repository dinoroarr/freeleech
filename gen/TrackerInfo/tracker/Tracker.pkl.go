// Code generated from Pkl module `main.trackerInfo.gen.TrackerInfo`. DO NOT EDIT.
package tracker

import (
	"encoding"
	"fmt"
)

type Tracker string

const (
	RHD Tracker = "RHD"
	MTV Tracker = "MTV"
	EMP Tracker = "EMP"
)

// String returns the string representation of Tracker
func (rcv Tracker) String() string {
	return string(rcv)
}

var _ encoding.BinaryUnmarshaler = new(Tracker)

// UnmarshalBinary implements encoding.BinaryUnmarshaler for Tracker.
func (rcv *Tracker) UnmarshalBinary(data []byte) error {
	switch str := string(data); str {
	case "RHD":
		*rcv = RHD
	case "MTV":
		*rcv = MTV
	case "EMP":
		*rcv = EMP
	default:
		return fmt.Errorf(`illegal: "%s" is not a valid Tracker`, str)
	}
	return nil
}
