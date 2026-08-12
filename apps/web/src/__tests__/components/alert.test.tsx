import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "@/components/ui/alert";

describe("Alert", () => {
  it("renders with title and content", () => {
    render(<Alert variant="error" title="Error">Something went wrong</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Error");
    expect(alert).toHaveTextContent("Something went wrong");
  });

  it("renders without title", () => {
    render(<Alert variant="info">Just a message</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Just a message");
  });
});
