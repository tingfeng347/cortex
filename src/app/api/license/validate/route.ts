import { NextResponse } from "next/server";
import { validateLicense, activateDevice } from "@/lib/auth/license";

export async function POST(request: Request) {
  try {
    const { licenseKey, deviceId } = (await request.json()) as {
      licenseKey?: string;
      deviceId?: string;
    };

    if (!licenseKey || typeof licenseKey !== "string") {
      return NextResponse.json({ valid: false, reason: "请提供 License Key" }, { status: 400 });
    }

    // Validate the license
    const result = await validateLicense(licenseKey);

    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason });
    }

    // Activate device (if deviceId provided)
    let deviceResult = null;
    if (deviceId) {
      const r = await activateDevice(licenseKey, deviceId);
      deviceResult = {
        success: r.success,
        reason: r.reason ?? null,
        deviceCount: r.deviceCount ?? result.license!.deviceCount,
        maxDevices: r.maxDevices ?? result.license!.maxDevices,
      };

      if (!r.success) {
        return NextResponse.json({
          valid: false,
          reason: r.reason === "device_limit" ? "device_limit" : r.reason,
          license: result.license,
          device: deviceResult,
        });
      }
    }

    return NextResponse.json({
      valid: true,
      license: result.license,
      device: deviceResult ?? {
        success: true,
        deviceCount: result.license!.deviceCount,
        maxDevices: result.license!.maxDevices,
      },
    });
  } catch (error) {
    console.error("[license/validate] Unexpected error:", error);
    return NextResponse.json({ valid: false, reason: "服务器错误，请稍后重试。" }, { status: 500 });
  }
}
