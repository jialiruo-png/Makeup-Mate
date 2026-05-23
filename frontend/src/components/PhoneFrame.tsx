import type { ReactNode } from "react";
import "./PhoneFrame.css";

interface PhoneFrameProps {
  children: ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="phone-frame">
      <div className="phone-bezel">
        <div className="phone-notch" />
        <div className="phone-screen">{children}</div>
        <div className="phone-home-indicator" />
      </div>
    </div>
  );
}
