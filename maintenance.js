/* =====================================================
   FINORA MAINTENANCE GUARD
   NORMAL USER PAGES ONLY
===================================================== */

(function () {

    async function checkMaintenance() {

        try {

            const response = await fetch(
                "https://finora-platform.onrender.com/api/maintenance",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (
                !data.success ||
                data.maintenance !== true
            ) {
                return;
            }

            document.documentElement.innerHTML = `
                <head>
                    <meta charset="UTF-8">
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    >
                    <title>FINORA — Maintenance</title>
                </head>

                <body style="
                    margin:0;
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    padding:24px;
                    box-sizing:border-box;
                    background:
                        radial-gradient(
                            circle at top,
                            rgba(234,60,255,.16),
                            transparent 40%
                        ),
                        linear-gradient(
                            135deg,
                            #050409,
                            #0A0610,
                            #050409
                        );
                    color:#ffffff;
                    font-family:
                        Inter,
                        -apple-system,
                        BlinkMacSystemFont,
                        'Segoe UI',
                        Roboto,
                        Arial,
                        sans-serif;
                    text-align:center;
                ">

                    <div style="
                        width:min(100%,520px);
                        padding:38px 25px;
                        border-radius:26px;
                        box-sizing:border-box;
                        background:
                            linear-gradient(
                                145deg,
                                rgba(31,16,43,.97),
                                rgba(8,6,13,.98)
                            );
                        border:1px solid rgba(234,60,255,.24);
                        box-shadow:
                            0 30px 80px rgba(0,0,0,.55);
                    ">

                        <div style="
                            font-family:'Times New Roman',serif;
                            font-size:42px;
                            font-weight:700;
                            letter-spacing:.5px;
                            margin-bottom:8px;
                        ">
                            <span style="color:#FFFFFF;">
                                FIN
                            </span><span style="color:#F5A623;">
                                ORA
                            </span>
                        </div>

                        <div style="
                            color:#EA3CFF;
                            font-size:10px;
                            font-weight:800;
                            letter-spacing:2px;
                            margin-bottom:30px;
                        ">
                            INVEST • GROW • EARN
                        </div>

                        <div style="
                            width:68px;
                            height:68px;
                            margin:0 auto 22px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            border-radius:20px;
                            background:rgba(234,60,255,.08);
                            border:1px solid rgba(234,60,255,.22);
                            color:#F5A623;
                            font-size:30px;
                        ">
                            ⚙
                        </div>

                        <h1 style="
                            margin:0 0 14px;
                            font-family:'Times New Roman',serif;
                            font-size:32px;
                            line-height:1.15;
                        ">
                            FINORA is under maintenance
                        </h1>

                        <p style="
                            margin:0 auto;
                            max-width:430px;
                            color:#A9A0AE;
                            font-size:15px;
                            line-height:1.7;
                        ">
                            ${
                                data.message ||
                                "FINORA is currently undergoing scheduled maintenance. Please check back shortly."
                            }
                        </p>

                        <div style="
                            margin-top:28px;
                            padding:12px 15px;
                            border-radius:12px;
                            background:rgba(245,166,35,.06);
                            border:1px solid rgba(245,166,35,.16);
                            color:#D9C38A;
                            font-size:12px;
                            line-height:1.5;
                        ">
                            Your account and investment activity remain
                            safely maintained while we work on the platform.
                        </div>

                    </div>

                </body>
            `;

        } catch (error) {

            console.warn(
                "FINORA maintenance check unavailable.",
                error
            );

        }

    }

    checkMaintenance();

})();
