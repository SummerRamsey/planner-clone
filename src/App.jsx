import { useState, useEffect, useMemo } from "react";

var uid = function () {
  return Math.random().toString(36).slice(2, 10);
};

var safeP}.btnlift:hover{transform:translateY(-1px);box-shadow:0 18px 34px rgba(0,0,0,0.12)}::selection{background:rgba(247,169,196,0.45)}"var safeParse = function (s, fallback) {
        }
      </style>

      {/* ========== HEADER ========== */}
      <header
        style={{
          background: THEME.header,
          padding: 16,
          boxShadow: "0 18px 50px rgba(0,0,0,0.10)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "rgba(255,255,255,0.85)",
                display: "grid",
                placeItems: "center",
                boxShadow:
                  "0 12px 26px rgba(0,0,0,0.10)",
                fontSize: 20,
              }}
            >
              🧁
            </div>
            <div>
              <div
                style={{ fontSize: 22, fontWeight: 950 }}
              >
                My Planner
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: THEME.subtext,
                  fontWeight: 700,
                }}
              >
                📊 {allTotal} • ✅ {allDone}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              style={pillBtn(view === "board")}
              onClick={function () {
                setView("board");
              }}
              className="btnlift"
            >
              📋 Board
            </button>
            <button
              style={pillBtn(view === "month")}
              onClick={function () {
                setView("month");
              }}
              className="btnlift"
            >
              🗓️ Month
            </button>
            <button
              style={pillBtn(false)}
              onClick={openSync}
              className="btnlift"
            >
              🔄 Sync
            </button>
            <button
              style={pillBtn(false)}
              onClick={function () {
                openBucketEditor(null);
              }}
              className="btnlift"
            >
              + Bucket
            </button>
          </div>
        </div>

        {/* Bucket Tabs */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {buckets.map(function (b) {
            var active = b.id === currentBucketId;
            var count = tasks.filter(function (t) {
              return t.bucketId === b.id;
            }).length;
            var dot =
              BUCKET_DOTS[b.id] || THEME.accent;

            return (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <button
                  style={{
                    border: "none",
                    borderRadius: "14px 14px 0 0",
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 950 : 700,
                    background: active
                      ? "rgba(255,255,255,0.92)"
                      : "rgba(255,255,255,0.45)",
                    color: THEME.text,
                    boxShadow: active
                      ? "0 10px 24px rgba(0,0,0,0.06)"
                      : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={function () {
                    setCurrentBucketId(b.id);
                    setViewingTaskId(null);
                  }}
                  className="btnlift"
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: dot,
                      display: "inline-block",
                    }}
                  />
                  {b.name}
                  <span
                    style={{
                      opacity: 0.7,
                      fontSize: 12,
                    }}
                  >
                    ({count})
                  </span>
                </button>
                {active && (
                  <span
                    style={{
                      display: "inline-flex",
                      gap: 2,
                    }}
                  >
                    <button
                      onClick={function () {
                        openBucketEditor(b);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={function () {
                        deleteBucket(b.id);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 13,
                        color: "#D36C7D",
                      }}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* ========== TOOLBAR ========== */}
      <div
        style={{
          padding: 14,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={searchQuery}
          onChange={function (e) {
            setSearchQuery(e.target.value);
          }}
          placeholder={
            "Search in " +
            (currentBucket ? currentBucket.name : "") +
            "..."
          }
          style={{
            flex: 1,
            minWidth: 220,
            padding: "12px 14px",
            borderRadius: 18,
            border: THEME.softBorder,
            background: THEME.inputBg,
            outline: "none",
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            fontWeight: 700,
            color: THEME.text,
          }}
        />
        <select
          value={filterPriority}
          onChange={function (e) {
            setFilterPriority(e.target.value);
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 18,
            border: THEME.softBorder,
            background: THEME.inputBg,
            fontWeight: 800,
            color: THEME.text,
          }}
        >
          <option value="All">All priorities</option>
          <option value="Urgent">💗 Urgent</option>
          <option value="High">❤️ High</option>
          <option value="Medium">💜 Medium</option>
          <option value="Low">💚 Low</option>
        </select>
        <select
          value={sortBy}
          onChange={function (e) {
            setSortBy(e.target.value);
          }}
          style={{
            padding: "12px 14px",
            borderRadius: 18,
            border: THEME.softBorder,
            background: THEME.inputBg,
            fontWeight: 800,
            color: THEME.text,
          }}
        >
          <option value="none">Sort: default</option>
          <option value="priority">
            Sort: priority
          </option>
          <option value="dueDate">
            Sort: due date
          </option>
          <option value="name">Sort: name</option>
        </select>
        <button
          onClick={function () {
            openNewTask("To Do");
          }}
          style={softBtn(THEME.accent)}
          className="btnlift"
        >
          + New Task
        </button>
      </div>

      {/* ========== BOARD VIEW ========== */}
      {view === "board" && (
        <div
          style={{
            padding: 14,
            display: "flex",
            gap: 14,
            overflowX: "auto",
          }}
        >
          {COLUMNS.map(function (col) {
            var colTasks = doSort(
              filteredTasks.filter(function (t) {
                return t.column === col;
              })
            );

            return (
              <div
                key={col}
                onDragOver={function (e) {
                  e.preventDefault();
                }}
                onDrop={function () {
                  onDropColumn(col);
                }}
                style={{
                  minWidth: 300,
                  maxWidth: 400,
                  flex: 1,
                  background:
                    "rgba(255,255,255,0.55)",
                  border: THEME.softBorder,
                  borderRadius: 24,
                  padding: 14,
                  boxShadow:
                    "0 18px 40px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 950,
                      fontSize: 15,
                    }}
                  >
                    {col}
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background:
                        "rgba(179,157,219,0.25)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 950,
                      fontSize: 13,
                    }}
                  >
                    {colTasks.length}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {colTasks.map(function (t) {
                    var expanded =
                      viewingTaskId === t.id;
                    var progress = getProgress(t);
                    var overdue = isOverdue(t);
                    var dueToday = isDueToday(t);
                    var dueSoon = isDueSoon(t);
                    var tint =
                      PRIORITY_COLORS[t.priority] +
                      "55";

                    return (
                      <div
                        key={t.id}
                        draggable={true}
                        onDragStart={function () {
                          onDragStart(t.id);
                        }}
                        onClick={function () {
                          setViewingTaskId(
                            expanded ? null : t.id
                          );
                        }}
                        className="lift"
                        style={{
                          background: tint,
                          border:
                            "1px solid rgba(0,0,0,0.03)",
                          borderLeft:
                            "10px solid " +
                            PRIORITY_COLORS[
                              t.priority
                            ],
                          borderRadius: 22,
                          padding: 12,
                          cursor: "pointer",
                          boxShadow:
                            THEME.cardShadow,
                        }}
                      >
                        {t.pinned && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 950,
                              color: "#7B6AA9",
                              marginBottom: 4,
                            }}
                          >
                            📌 PINNED
                          </div>
                        )}

                        {t.labels &&
                          t.labels.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                marginBottom: 6,
                              }}
                            >
                              {t.labels.map(
                                function (l) {
                                  var lo = null;
                                  for (
                                    var li = 0;
                                    li <
                                    LABELS.length;
                                    li++
                                  ) {
                                    if (
                                      LABELS[li]
                                        .name === l
                                    )
                                      lo = LABELS[li];
                                  }
                                  return (
                                    <span
                                      key={l}
                                      style={{
                                        background: lo
                                          ? lo.color
                                          : "#9AA7B3",
                                        color:
                                          "white",
                                        padding:
                                          "2px 8px",
                                        borderRadius: 999,
                                        fontSize: 10,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {l}
                                    </span>
                                  );
                                }
                              )}
                            </div>
                          )}

                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 950,
                            marginBottom: 4,
                          }}
                        >
                          {t.title}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: 999,
                              background:
                                "rgba(255,255,255,0.65)",
                              fontWeight: 900,
                              fontSize: 12,
                            }}
                          >
                            {
                              PRIORITY_EMOJI[
                                t.priority
                              ]
                            }{" "}
                            {t.priority}
                          </span>
                          {t.assignee && (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#44546B",
                              }}
                            >
                              👤 {t.assignee}
                            </span>
                          )}
                          {overdue && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 950,
                                color: "#B5475A",
                              }}
                            >
                              ⚠️ OVERDUE
                            </span>
                          )}
                          {dueToday && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 950,
                                color: "#B1762B",
                              }}
                            >
                              📌 TODAY
                            </span>
                          )}
                          {dueSoon && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 950,
                                color: "#8E7A2A",
                              }}
                            >
                              🔔 SOON
                            </span>
                          )}
                        </div>

                        {(t.startDate ||
                          t.dueDate) && (
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: THEME.subtext,
                              marginBottom: 6,
                            }}
                          >
                            {t.startDate && (
                              <div>
                                📅 Start:{" "}
                                {t.startDate}
                              </div>
                            )}
                            {t.dueDate && (
                              <div>
                                ⏰ Due: {t.dueDate}
                              </div>
                            )}
                          </div>
                        )}

                        {progress !== null && (
                          <div
                            style={{
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                height: 8,
                                borderRadius: 999,
                                background:
                                  "rgba(255,255,255,0.65)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width:
                                    progress + "%",
                                  background:
                                    progress === 100
                                      ? "#7FC49B"
                                      : "#7FB7D9",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 900,
                                color:
                                  THEME.subtext,
                                marginTop: 4,
                              }}
                            >
                              {progress}%
                            </div>
                          </div>
                        )}

                        {!expanded &&
                          t.comments &&
                          t.comments.length > 0 && (
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color:
                                  THEME.subtext,
                              }}
                            >
                              💬{" "}
                              {t.comments.length}{" "}
                              comment
                              {t.comments.length ===
                              1
                                ? ""
                                : "s"}
                            </div>
                          )}

                        {/* EXPANDED */}
                        {expanded && (
                          <div
                            style={{
                              marginTop: 10,
                              paddingTop: 10,
                              borderTop:
                                "1px solid rgba(255,255,255,0.7)",
                            }}
                          >
                            {t.notes && (
                              <div
                                style={{
                                  marginBottom: 10,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 950,
                                    marginBottom: 4,
                                  }}
                                >
                                  📝 Notes
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "#3A485B",
                                    whiteSpace:
                                      "pre-wrap",
                                  }}
                                >
                                  {t.notes}
                                </div>
                              </div>
                            )}

                            {t.checklist &&
                              t.checklist.length >
                                0 && (
                                <div
                                  style={{
                                    marginBottom: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 950,
                                      marginBottom: 6,
                                    }}
                                  >
                                    ☑️ Checklist
                                  </div>
                                  {t.checklist.map(
                                    function (c, i) {
                                      return (
                                        <div
                                          key={i}
                                          onClick={function (
                                            e
                                          ) {
                                            e.stopPropagation();
                                            toggleChecklist(
                                              t.id,
                                              i
                                            );
                                          }}
                                          style={{
                                            display:
                                              "flex",
                                            gap: 8,
                                            alignItems:
                                              "center",
                                            fontSize: 13,
                                            padding:
                                              "3px 0",
                                            fontWeight: 750,
                                            cursor:
                                              "pointer",
                                          }}
                                        >
                                          <span>
                                            {c.done
                                              ? "✅"
                                              : "⬜"}
                                          </span>
                                          <span
                                            style={{
                                              textDecoration:
                                                c.done
                                                  ? "line-through"
                                                  : "none",
                                              color:
                                                c.done
                                                  ? THEME.subtext
                                                  : THEME.text,
                                            }}
                                          >
                                            {c.text}
                                          </span>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                            {t.comments &&
                              t.comments.length >
                                0 && (
                                <div
                                  style={{
                                    marginBottom: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 950,
                                      marginBottom: 6,
                                    }}
                                  >
                                    💬 Comments
                                  </div>
                                  {t.comments.map(
                                    function (c, i) {
                                      return (
                                        <div
                                          key={i}
                                          style={{
                                            background:
                                              "rgba(255,255,255,0.65)",
                                            borderRadius: 14,
                                            padding: 10,
                                            marginBottom: 6,
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 13,
                                            }}
                                          >
                                            {c.text}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 11,
                                              color:
                                                THEME.subtext,
                                              marginTop: 4,
                                            }}
                                          >
                                            {c.date}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {COLUMNS.filter(
                                function (c) {
                                  return (
                                    c !== t.column
                                  );
                                }
                              ).map(function (c) {
                                return (
                                  <button
                                    key={c}
                                    onClick={function (
                                      e
                                    ) {
                                      e.stopPropagation();
                                      moveTask(
                                        t.id,
                                        c
                                      );
                                    }}
                                    style={{
                                      border: "none",
                                      background:
                                        "rgba(255,255,255,0.75)",
                                      borderRadius: 999,
                                      padding:
                                        "8px 10px",
                                      cursor:
                                        "pointer",
                                      fontWeight: 900,
                                      fontSize: 12,
                                      color:
                                        "#4A5568",
                                    }}
                                    className="btnlift"
                                  >
                                    → {c}
                                  </button>
                                );
                              })}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={function (
                                  e
                                ) {
                                  e.stopPropagation();
                                  togglePin(t.id);
                                }}
                                style={softBtn(
                                  t.pinned
                                    ? THEME.accent2
                                    : THEME.accent
                                )}
                                className="btnlift"
                              >
                                {t.pinned
                                  ? "📌 Unpin"
                                  : "📌 Pin"}
                              </button>
                              <button
                                onClick={function (
                                  e
                                ) {
                                  e.stopPropagation();
                                  openEditTask(t);
                                }}
                                style={softBtn(
                                  "#7FB7D9"
                                )}
                                className="btnlift"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={function (
                                  e
                                ) {
                                  e.stopPropagation();
                                  addComment(t.id);
                                }}
                                style={softBtn(
                                  "#F0A9C2"
                                )}
                                className="btnlift"
                              >
                                💬
                              </button>
                              <button
                                onClick={function (
                                  e
                                ) {
                                  e.stopPropagation();
                                  removeTask(t.id);
                                }}
                                style={softBtn(
                                  "#D36C7D"
                                )}
                                className="btnlift"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={function () {
                    openNewTask(col);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 22,
                    border:
                      "2px dashed rgba(179,157,219,0.55)",
                    background:
                      "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    fontWeight: 950,
                    color: "#6B7A90",
                  }}
                  className="btnlift"
                >
                  + Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== MONTH VIEW ========== */}
      {view === "month" && (
        <div style={{ padding: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button
                style={pillBtn(false)}
                className="btnlift"
                onClick={function () {
                  setMonthCursor(
                    addMonths(monthCursor, -1)
                  );
                }}
              >
                ◀
              </button>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                {monthCursor.toLocaleString(
                  undefined,
                  { month: "long", year: "numeric" }
                )}
              </div>
              <button
                style={pillBtn(false)}
                className="btnlift"
                onClick={function () {
                  setMonthCursor(
                    addMonths(monthCursor, 1)
                  );
                }}
              >
                ▶
              </button>
              <button
                style={softBtn("#7FB7D9")}
                className="btnlift"
                onClick={function () {
                  setMonthCursor(
                    startOfMonth(new Date())
                  );
                  setSelectedDay(
                    yyyyMmDd(new Date())
                  );
                }}
              >
                Today
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 10,
            }}
          >
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map(function (d) {
              return (
                <div
                  key={d}
                  style={{
                    fontWeight: 950,
                    fontSize: 12,
                    color: THEME.subtext,
                    padding: "0 8px",
                  }}
                >
                  {d}
                </div>
              );
            })}

            {cells.map(function (c, idx) {
              var key = yyyyMmDd(c.date);
              var dayTasks =
                tasksByDueDate[key] || [];
              var selected = key === selectedDay;

              return (
                <div
                  key={idx}
                  onClick={function () {
                    setSelectedDay(key);
                  }}
                  className="lift"
                  style={{
                    background: selected
                      ? "rgba(179,157,219,0.25)"
                      : "rgba(255,255,255,0.70)",
                    border: THEME.softBorder,
                    borderRadius: 22,
                    padding: 12,
                    minHeight: 92,
                    cursor: "pointer",
                    opacity: c.inMonth ? 1 : 0.45,
                    boxShadow: THEME.cardShadow,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>
                      {c.date.getDate()}
                      {c.isToday && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: THEME.accent2,
                          }}
                        >
                          ●
                        </span>
                      )}
                    </div>
                    {dayTasks.length > 0 && (
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background:
                            "rgba(255,255,255,0.75)",
                          fontWeight: 950,
                          fontSize: 12,
                        }}
                      >
                        {dayTasks.length}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {dayTasks
                      .slice(0, 2)
                      .map(function (t) {
                        return (
                          <div
                            key={t.id}
                            style={{
                              borderLeft:
                                "8px solid " +
                                PRIORITY_COLORS[
                                  t.priority
                                ],
                              paddingLeft: 8,
                              fontSize: 11,
                              fontWeight: 900,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                            }}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                    {dayTasks.length > 2 && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: THEME.subtext,
                        }}
                      >
                        + {dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              background: "rgba(255,255,255,0.75)",
              border: THEME.softBorder,
              borderRadius: 24,
              padding: 14,
              boxShadow: THEME.cardShadow,
            }}
          >
            <div style={{ fontWeight: 950 }}>
              Tasks due on{" "}
              <span style={{ color: THEME.accent }}>
                {selectedDay}
              </span>
            </div>
            {selectedDayTasks.length === 0 ? (
              <div
                style={{
                  marginTop: 10,
                  color: THEME.subtext,
                  fontWeight: 800,
                }}
              >
                No tasks due this day.
              </div>
            ) : (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {selectedDayTasks.map(function (t) {
                  var bName = "?";
                  for (
                    var i = 0;
                    i < buckets.length;
                    i++
                  ) {
                    if (buckets[i].id === t.bucketId)
                      bName = buckets[i].name;
                  }
                  return (
                    <div
                      key={t.id}
                      className="lift"
                      style={{
                        background:
                          PRIORITY_COLORS[
                            t.priority
                          ] + "55",
                        borderRadius: 22,
                        padding: 12,
                        borderLeft:
                          "10px solid " +
                          PRIORITY_COLORS[t.priority],
                        boxShadow:
                          THEME.cardShadow,
                      }}
                    >
                      <div
                        style={{ fontWeight: 950 }}
                      >
                        {t.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: THEME.subtext,
                          marginTop: 4,
                        }}
                      >
                        {bName} • {t.column} •{" "}
                        {PRIORITY_EMOJI[t.priority]}{" "}
                        {t.priority}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          marginTop: 10,
                        }}
                      >
                        <button
                          style={softBtn("#7FB7D9")}
                          className="btnlift"
                          onClick={function () {
                            setCurrentBucketId(
                              t.bucketId
                            );
                            setView("board");
                            setViewingTaskId(t.id);
                          }}
                        >
                          Open on Board
                        </button>
                        <button
                          style={softBtn(
                            THEME.accent
                          )}
                          className="btnlift"
                          onClick={function () {
                            openEditTask(t);
                          }}
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== TASK MODAL ========== */}
      {showTaskModal && (
        <div
          onClick={function () {
            setShowTaskModal(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 14,
          }}
        >
          <div
            onClick={function (e) {
              e.stopPropagation();
            }}
            style={{
              width: "100%",
              maxWidth: 640,
              background: "rgba(255,255,255,0.95)",
              border: THEME.softBorder,
              borderRadius: 28,
              padding: 16,
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.18)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 950,
                marginBottom: 10,
              }}
            >
              {editingTaskId
                ? "✏️ Edit Task"
                : "➕ New Task"}
            </div>

            <label
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: THEME.subtext,
              }}
            >
              Title *
            </label>
            <input
              value={form.title}
              onChange={function (e) {
                updateForm("title", e.target.value);
              }}
              placeholder="What needs to be done?"
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 10,
                padding: "12px 14px",
                borderRadius: 18,
                border: THEME.softBorder,
                background: THEME.inputBg,
                fontWeight: 800,
                boxSizing: "border-box",
              }}
            />

            <label
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: THEME.subtext,
              }}
            >
              Assigned To
            </label>
            <input
              value={form.assignee}
              onChange={function (e) {
                updateForm(
                  "assignee",
                  e.target.value
                );
              }}
              placeholder="Who's owning this?"
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 10,
                padding: "12px 14px",
                borderRadius: 18,
                border: THEME.softBorder,
                background: THEME.inputBg,
                fontWeight: 800,
                boxSizing: "border-box",
              }}
            />

            <label
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: THEME.subtext,
              }}
            >
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={function (e) {
                updateForm("notes", e.target.value);
              }}
              rows={3}
              placeholder="Add details…"
              style={{
                width: "100%",
                marginTop: 6,
                marginBottom: 10,
                padding: "12px 14px",
                borderRadius: 18,
                border: THEME.softBorder,
                background: THEME.inputBg,
                fontWeight: 750,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: THEME.subtext,
                  }}
                >
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={function (e) {
                    updateForm(
                      "priority",
                      e.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "12px 14px",
                    borderRadius: 18,
                    border: THEME.softBorder,
                    background: THEME.inputBg,
                    fontWeight: 900,
                  }}
                >
                  <option value="Urgent">
                    💗 Urgent
                  </option>
                  <option value="High">
                    ❤️ High
                  </option>
                  <option value="Medium">
                    💜 Medium
                  </option>
                  <option value="Low">💚 Low</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: THEME.subtext,
                  }}
                >
                  Status
                </label>
                <select
                  value={form.column}
                  onChange={function (e) {
                    updateForm(
                      "column",
                      e.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "12px 14px",
                    borderRadius: 18,
                    border: THEME.softBorder,
                    background: THEME.inputBg,
                    fontWeight: 900,
                  }}
                >
                  {COLUMNS.map(function (c) {
                    return (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: THEME.subtext,
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={function (e) {
                    updateForm(
                      "startDate",
                      e.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "12px 14px",
                    borderRadius: 18,
                    border: THEME.softBorder,
                    background: THEME.inputBg,
                    fontWeight: 850,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: THEME.subtext,
                  }}
                >
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={function (e) {
                    updateForm(
                      "dueDate",
                      e.target.value
                    );
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "12px 14px",
                    borderRadius: 18,
                    border: THEME.softBorder,
                    background: THEME.inputBg,
                    fontWeight: 850,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={function () {
                  updateForm("pinned", !form.pinned);
                }}
                style={softBtn(
                  form.pinned
                    ? THEME.accent2
                    : THEME.accent
                )}
                className="btnlift"
              >
                {form.pinned
                  ? "📌 Pinned"
                  : "📌 Pin"}
              </button>
              <button
                onClick={function () {
                  var txt = prompt("Checklist item:");
                  if (!txt) return;
                  updateForm(
                    "checklist",
                    form.checklist.concat([
                      { text: txt, done: false },
                    ])
                  );
                }}
                style={softBtn("#7FB7D9")}
                className="btnlift"
              >
                + Checklist
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              {LABELS.map(function (l) {
                var sel =
                  form.labels.indexOf(l.name) >= 0;
                return (
                  <button
                    key={l.name}
                    onClick={function () {
                      if (sel) {
                        updateForm(
                          "labels",
                          form.labels.filter(
                            function (x) {
                              return x !== l.name;
                            }
                          )
                        );
                      } else {
                        updateForm(
                          "labels",
                          form.labels.concat([
                            l.name,
                          ])
                        );
                      }
                    }}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 12,
                      background: sel
                        ? l.color
                        : "rgba(255,255,255,0.65)",
                      color: sel
                        ? "#fff"
                        : THEME.text,
                    }}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>

            {form.checklist.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {form.checklist.map(function (c, i) {
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span>
                        {c.done ? "✅" : "⬜"}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                        }}
                      >
                        {c.text}
                      </span>
                      <button
                        onClick={function () {
                          updateForm(
                            "checklist",
                            form.checklist.filter(
                              function (_, idx) {
                                return idx !== i;
                              }
                            )
                          );
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#D36C7D",
                          fontWeight: 900,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={function () {
                  setShowTaskModal(false);
                }}
                style={pillBtn(false)}
                className="btnlift"
              >
                Cancel
              </button>
              <button
                onClick={upsertTask}
                style={softBtn(THEME.accent)}
                className="btnlift"
              >
                {editingTaskId
                  ? "Save Changes"
                  : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== BUCKET MODAL ========== */}
      {showBucketModal && (
        <div
          onClick={function () {
            setShowBucketModal(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 14,
          }}
        >
          <div
            onClick={function (e) {
              e.stopPropagation();
            }}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "rgba(255,255,255,0.95)",
              border: THEME.softBorder,
              borderRadius: 28,
              padding: 16,
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 950,
                marginBottom: 10,
              }}
            >
              {editingBucketId
                ? "✏️ Rename Bucket"
                : "📂 New Bucket"}
            </div>
            <input
              value={bucketFormName}
              onChange={function (e) {
                setBucketFormName(e.target.value);
              }}
              onKeyDown={function (e) {
                if (e.key === "Enter") saveBucket();
              }}
              placeholder="Bucket name"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 18,
                border: THEME.softBorder,
                background: THEME.inputBg,
                fontWeight: 850,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 12,
              }}
            >
              <button
                onClick={function () {
                  setShowBucketModal(false);
                }}
                style={pillBtn(false)}
                className="btnlift"
              >
                Cancel
              </button>
              <button
                onClick={saveBucket}
                style={softBtn(THEME.accent)}
                className="btnlift"
              >
                {editingBucketId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== SYNC MODAL ========== */}
      {showSyncModal && (
        <div
          onClick={function () {
            setShowSyncModal(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 14,
          }}
        >
          <div
            onClick={function (e) {
              e.stopPropagation();
            }}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "rgba(255,255,255,0.95)",
              border: THEME.softBorder,
              borderRadius: 28,
              padding: 16,
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.18)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 950,
                marginBottom: 10,
              }}
            >
              🔄 Sync Between Devices
            </div>

            <div
              style={{
                background:
                  "rgba(247,169,196,0.12)",
                border: THEME.softBorder,
                borderRadius: 22,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontWeight: 950,
                  marginBottom: 6,
                }}
              >
                📤 Export
              </div>
              <textarea
                readOnly={true}
                value={syncExportCode}
                onClick={function (e) {
                  e.target.select();
                }}
                style={{
                  width: "100%",
                  height: 120,
                  padding: 12,
                  borderRadius: 18,
                  border: THEME.softBorder,
                  background:
                    "rgba(255,255,255,0.85)",
                  fontFamily: "monospace",
                  fontSize: 11,
                  boxSizing: "border-box",
                  resize: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button
                  onClick={copySyncCode}
                  style={softBtn(THEME.accent2)}
                  className="btnlift"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>

            <div
              style={{
                background:
                  "rgba(167,220,195,0.12)",
                border: THEME.softBorder,
                borderRadius: 22,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontWeight: 950,
                  marginBottom: 6,
                }}
              >
                📥 Import
              </div>
              <textarea
                value={syncImportCode}
                onChange={function (e) {
                  setSyncImportCode(e.target.value);
                }}
                placeholder="Paste code here…"
                style={{
                  width: "100%",
                  height: 120,
                  padding: 12,
                  borderRadius: 18,
                  border: THEME.softBorder,
                  background:
                    "rgba(255,255,255,0.85)",
                  fontFamily: "monospace",
                  fontSize: 11,
                  boxSizing: "border-box",
                  resize: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button
                  onClick={importSync}
                  style={softBtn(THEME.accent3)}
                  className="btnlift"
                >
                  📥 Import
                </button>
              </div>
            </div>

            {syncMessage && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 18,
                  background:
                    "rgba(179,157,219,0.18)",
                  border: THEME.softBorder,
                  fontWeight: 900,
                }}
              >
                {syncMessage}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                onClick={function () {
                  setShowSyncModal(false);
                }}
                style={pillBtn(false)}
                className="btnlift"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 22 }} />
    </div>
  );
}
  try {
    var v = JSON.parse(s);
    if (v == null) return fallback;
    return v;
  } catch (e) {
    return fallback;
  }
};

var encodeSync = function (obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
};

var decodeSync = function (code) {
  return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
};

var yyyyMmDd = function (d) {
  var dt = new Date(d);
  var y = dt.getFullYear();
  var m = String(dt.getMonth() + 1).padStart(2, "0");
  var day = String(dt.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
};

var startOfMonth = function (d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

var addMonths = function (d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
};

var getCalendarGrid = function (monthDate) {
  var first = startOfMonth(monthDate);
  var startIdx = first.getDay();
  var gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startIdx);
  var cells = [];
  for (var i = 0; i < 42; i++) {
    var d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === monthDate.getMonth(),
      isToday: yyyyMmDd(d) === yyyyMmDd(new Date()),
    });
  }
  return cells;
};

var COLUMNS = ["To Do", "In Progress", "Review", "Done"];

var DEFAULT_BUCKETS = [
  { id: "saddleside", name: "Saddleside" },
  { id: "legacy", name: "Legacy Fields" },
  { id: "lonestar", name: "Lonestar" },
  { id: "alpha", name: "Alpha Ranch" },
  { id: "willow", name: "Willowstone" },
  { id: "other", name: "Other" },
];

var PRIORITY_ORDER = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

var PRIORITY_EMOJI = {
  Urgent: "💗",
  High: "❤️",
  Medium: "💜",
  Low: "💚",
};

var PRIORITY_COLORS = {
  Urgent: "#F7C2D4",
  High: "#F3B3B3",
  Medium: "#DCC8F7",
  Low: "#C8F0D7",
};

var LABELS = [
  { name: "Important", color: "#F3B3B3" },
  { name: "Call", color: "#F7C2D4" },
  { name: "Docs", color: "#DCC8F7" },
  { name: "Follow-up", color: "#C8F0D7" },
  { name: "Meeting", color: "#F6D7A9" },
  { name: "Personal", color: "#BEE9F7" },
];

var BUCKET_DOTS = {
  saddleside: "#BFD7F2",
  legacy: "#BFEAD2",
  lonestar: "#F6D7C3",
  alpha: "#DCC8F7",
  willow: "#BEE9F7",
  other: "#D6DCE6",
};

var THEME = {
  bg: "#FBF7FF",
  header: "linear-gradient(135deg, #DCE7F6 0%, #EADCF6 50%, #F6DCEB 100%)",
  text: "#2E3A4A",
  subtext: "#6B7A90",
  cardShadow: "0 12px 30px rgba(30,60,90,0.08)",
  softBorder: "1px solid rgba(200,214,235,0.55)",
  pill: "rgba(255,255,255,0.65)",
  accent: "#B39DDB",
  accent2: "#F7A9C4",
  accent3: "#A7DCC3",
  inputBg: "rgba(255,255,255,0.85)",
};

export default function App() {
  var [view, setView] = useState(function () {
    return localStorage.getItem("p_view") || "board";
  });

  var [buckets, setBuckets] = useState(function () {
    return safeParse(
      localStorage.getItem("p_buckets"),
      DEFAULT_BUCKETS
    );
  });

  var [currentBucketId, setCurrentBucketId] = useState(
    function () {
      return (
        localStorage.getItem("p_currentBucket") ||
        "saddleside"
      );
    }
  );

  var [tasks, setTasks] = useState(function () {
    return safeParse(
      localStorage.getItem("p_tasks"),
      []
    );
  });

  var [searchQuery, setSearchQuery] = useState("");
  var [filterPriority, setFilterPriority] =
    useState("All");
  var [sortBy, setSortBy] = useState("none");
  var [viewingTaskId, setViewingTaskId] = useState(null);
  var [dragTaskId, setDragTaskId] = useState(null);

  var [showTaskModal, setShowTaskModal] = useState(false);
  var [editingTaskId, setEditingTaskId] = useState(null);

  var [showBucketModal, setShowBucketModal] =
    useState(false);
  var [bucketFormName, setBucketFormName] = useState("");
  var [editingBucketId, setEditingBucketId] =
    useState(null);

  var [showSyncModal, setShowSyncModal] = useState(false);
  var [syncExportCode, setSyncExportCode] = useState("");
  var [syncImportCode, setSyncImportCode] = useState("");
  var [syncMessage, setSyncMessage] = useState("");

  var [monthCursor, setMonthCursor] = useState(
    function () {
      return startOfMonth(new Date());
    }
  );
  var [selectedDay, setSelectedDay] = useState(
    function () {
      return yyyyMmDd(new Date());
    }
  );

  var [form, setForm] = useState({
    title: "",
    notes: "",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    column: "To Do",
    labels: [],
    checklist: [],
    assignee: "",
    pinned: false,
    comments: [],
  });

  // Save
  useEffect(
    function () {
      localStorage.setItem("p_view", view);
    },
    [view]
  );
  useEffect(
    function () {
      localStorage.setItem(
        "p_buckets",
        JSON.stringify(buckets)
      );
    },
    [buckets]
  );
  useEffect(
    function () {
      localStorage.setItem(
        "p_currentBucket",
        currentBucketId
      );
    },
    [currentBucketId]
  );
  useEffect(
    function () {
      localStorage.setItem(
        "p_tasks",
        JSON.stringify(tasks)
      );
    },
    [tasks]
  );

  // Helpers
  var currentBucket = useMemo(
    function () {
      var found = null;
      for (var i = 0; i < buckets.length; i++) {
        if (buckets[i].id === currentBucketId) {
          found = buckets[i];
        }
      }
      return found || buckets[0];
    },
    [buckets, currentBucketId]
  );

  var bucketTasks = useMemo(
    function () {
      return tasks.filter(function (t) {
        return t.bucketId === currentBucketId;
      });
    },
    [tasks, currentBucketId]
  );

  var isOverdue = function (t) {
    if (!t.dueDate || t.column === "Done") return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  var isDueToday = function (t) {
    return (
      t.dueDate &&
      yyyyMmDd(t.dueDate) === yyyyMmDd(new Date()) &&
      t.column !== "Done"
    );
  };

  var isDueSoon = function (t) {
    if (!t.dueDate || t.column === "Done") return false;
    if (isOverdue(t) || isDueToday(t)) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    var diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 3;
  };

  var getProgress = function (t) {
    if (!t.checklist || t.checklist.length === 0)
      return null;
    var done = t.checklist.filter(function (c) {
      return c.done;
    }).length;
    return Math.round(
      (done / t.checklist.length) * 100
    );
  };

  var filteredTasks = useMemo(
    function () {
      var q = searchQuery.trim().toLowerCase();
      return bucketTasks.filter(function (t) {
        var ms =
          !q ||
          t.title.toLowerCase().indexOf(q) >= 0 ||
          (t.notes || "").toLowerCase().indexOf(q) >=
            0 ||
          (t.assignee || "").toLowerCase().indexOf(q) >=
            0;
        var mp =
          filterPriority === "All" ||
          t.priority === filterPriority;
        return ms && mp;
      });
    },
    [bucketTasks, searchQuery, filterPriority]
  );

  var doSort = function (list) {
    var pinned = list.filter(function (t) {
      return t.pinned;
    });
    var rest = list.filter(function (t) {
      return !t.pinned;
    });
    if (sortBy === "priority") {
      rest.sort(function (a, b) {
        return (
          (PRIORITY_ORDER[a.priority] || 2) -
          (PRIORITY_ORDER[b.priority] || 2)
        );
      });
    } else if (sortBy === "dueDate") {
      rest.sort(function (a, b) {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (
          new Date(a.dueDate) - new Date(b.dueDate)
        );
      });
    } else if (sortBy === "name") {
      rest.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
    }
    return pinned.concat(rest);
  };

  var updateForm = function (field, value) {
    var f = {
      title: form.title,
      notes: form.notes,
      priority: form.priority,
      startDate: form.startDate,
      dueDate: form.dueDate,
      column: form.column,
      labels: form.labels,
      checklist: form.checklist,
      assignee: form.assignee,
      pinned: form.pinned,
      comments: form.comments,
    };
    f[field] = value;
    setForm(f);
  };

  // Sync
  var openSync = function () {
    setSyncExportCode(
      encodeSync({
        v: 1,
        buckets: buckets,
        currentBucketId: currentBucketId,
        tasks: tasks,
      })
    );
    setSyncImportCode("");
    setSyncMessage("");
    setShowSyncModal(true);
  };

  var copySyncCode = function () {
    navigator.clipboard
      .writeText(syncExportCode)
      .then(function () {
        setSyncMessage("✅ Copied!");
      })
      .catch(function () {
        setSyncMessage(
          "⚠️ Tap code → Select All → Copy."
        );
      });
  };

  var importSync = function () {
    if (!syncImportCode.trim()) {
      setSyncMessage("⚠️ Paste a code first.");
      return;
    }
    try {
      var data = decodeSync(syncImportCode);
      if (Array.isArray(data.tasks))
        setTasks(data.tasks);
      if (Array.isArray(data.buckets))
        setBuckets(data.buckets);
      if (data.currentBucketId)
        setCurrentBucketId(data.currentBucketId);
      setSyncMessage("✅ Imported!");
      setTimeout(function () {
        setShowSyncModal(false);
        setSyncMessage("");
      }, 1200);
    } catch (e) {
      setSyncMessage("❌ Invalid code.");
    }
  };

  // Bucket CRUD
  var openBucketEditor = function (b) {
    if (b) {
      setEditingBucketId(b.id);
      setBucketFormName(b.name);
    } else {
      setEditingBucketId(null);
      setBucketFormName("");
    }
    setShowBucketModal(true);
  };

  var saveBucket = function () {
    var name = bucketFormName.trim();
    if (!name) return;
    if (editingBucketId) {
      setBuckets(
        buckets.map(function (b) {
          if (b.id === editingBucketId) {
            return { id: b.id, name: name };
          }
          return b;
        })
      );
    } else {
      var id = uid();
      setBuckets(
        buckets.concat([{ id: id, name: name }])
      );
      setCurrentBucketId(id);
    }
    setShowBucketModal(false);
  };

  var deleteBucket = function (bid) {
    if (buckets.length <= 1) {
      alert("You need at least one bucket.");
      return;
    }
    if (
      !confirm(
        "Delete this bucket and all its tasks?"
      )
    )
      return;
    var remaining = buckets.filter(function (b) {
      return b.id !== bid;
    });
    setBuckets(remaining);
    setTasks(
      tasks.filter(function (t) {
        return t.bucketId !== bid;
      })
    );
    if (currentBucketId === bid)
      setCurrentBucketId(remaining[0].id);
  };

  // Task CRUD
  var openNewTask = function (column) {
    setForm({
      title: "",
      notes: "",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      column: column || "To Do",
      labels: [],
      checklist: [],
      assignee: "",
      pinned: false,
      comments: [],
    });
    setEditingTaskId(null);
    setShowTaskModal(true);
  };

  var openEditTask = function (t) {
    setForm({
      title: t.title,
      notes: t.notes || "",
      priority: t.priority,
      startDate: t.startDate || "",
      dueDate: t.dueDate || "",
      column: t.column,
      labels: t.labels || [],
      checklist: t.checklist || [],
      assignee: t.assignee || "",
      pinned: !!t.pinned,
      comments: t.comments || [],
    });
    setEditingTaskId(t.id);
    setShowTaskModal(true);
  };

  var makeTask = function (id, created, bid, f) {
    return {
      id: id,
      createdAt: created,
      bucketId: bid,
      title: f.title,
      notes: f.notes,
      priority: f.priority,
      startDate: f.startDate,
      dueDate: f.dueDate,
      column: f.column,
      labels: f.labels,
      checklist: f.checklist,
      assignee: f.assignee,
      pinned: f.pinned,
      comments: f.comments,
    };
  };

  var upsertTask = function () {
    if (!form.title.trim()) {
      alert("Please enter a task title.");
      return;
    }
    if (editingTaskId) {
      setTasks(
        tasks.map(function (t) {
          if (t.id !== editingTaskId) return t;
          return makeTask(
            t.id,
            t.createdAt,
            t.bucketId,
            form
          );
        })
      );
    } else {
      setTasks(
        tasks.concat([
          makeTask(
            uid(),
            new Date().toISOString(),
            currentBucketId,
            form
          ),
        ])
      );
    }
    setShowTaskModal(false);
    setEditingTaskId(null);
  };

  var removeTask = function (id) {
    if (!confirm("Delete this task?")) return;
    setTasks(
      tasks.filter(function (t) {
        return t.id !== id;
      })
    );
    setViewingTaskId(null);
  };

  var moveTask = function (id, col) {
    setTasks(
      tasks.map(function (t) {
        if (t.id !== id) return t;
        return makeTask(t.id, t.createdAt, t.bucketId, {
          title: t.title,
          notes: t.notes,
          priority: t.priority,
          startDate: t.startDate,
          dueDate: t.dueDate,
          column: col,
          labels: t.labels,
          checklist: t.checklist,
          assignee: t.assignee,
          pinned: t.pinned,
          comments: t.comments,
        });
      })
    );
  };

  var togglePin = function (id) {
    setTasks(
      tasks.map(function (t) {
        if (t.id !== id) return t;
        return makeTask(t.id, t.createdAt, t.bucketId, {
          title: t.title,
          notes: t.notes,
          priority: t.priority,
          startDate: t.startDate,
          dueDate: t.dueDate,
          column: t.column,
          labels: t.labels,
          checklist: t.checklist,
          assignee: t.assignee,
          pinned: !t.pinned,
          comments: t.comments,
        });
      })
    );
  };

  var toggleChecklist = function (taskId, idx) {
    setTasks(
      tasks.map(function (t) {
        if (t.id !== taskId) return t;
        var list = t.checklist.map(function (c, i) {
          if (i === idx) {
            return { text: c.text, done: !c.done };
          }
          return c;
        });
        return makeTask(t.id, t.createdAt, t.bucketId, {
          title: t.title,
          notes: t.notes,
          priority: t.priority,
          startDate: t.startDate,
          dueDate: t.dueDate,
          column: t.column,
          labels: t.labels,
          checklist: list,
          assignee: t.assignee,
          pinned: t.pinned,
          comments: t.comments,
        });
      })
    );
  };

  var addComment = function (taskId) {
    var msg = prompt("Add comment:");
    if (!msg) return;
    setTasks(
      tasks.map(function (t) {
        if (t.id !== taskId) return t;
        return makeTask(t.id, t.createdAt, t.bucketId, {
          title: t.title,
          notes: t.notes,
          priority: t.priority,
          startDate: t.startDate,
          dueDate: t.dueDate,
          column: t.column,
          labels: t.labels,
          checklist: t.checklist,
          assignee: t.assignee,
          pinned: t.pinned,
          comments: (t.comments || []).concat([
            {
              text: msg.trim(),
              date: new Date().toLocaleString(),
            },
          ]),
        });
      })
    );
  };

  // Drag
  var onDragStart = function (id) {
    setDragTaskId(id);
  };
  var onDropColumn = function (col) {
    if (!dragTaskId) return;
    moveTask(dragTaskId, col);
    setDragTaskId(null);
  };

  // Calendar
  var cells = useMemo(
    function () {
      return getCalendarGrid(monthCursor);
    },
    [monthCursor]
  );

  var tasksByDueDate = useMemo(
    function () {
      var map = {};
      for (var i = 0; i < tasks.length; i++) {
        if (!tasks[i].dueDate) continue;
        var key = yyyyMmDd(tasks[i].dueDate);
        if (!map[key]) map[key] = [];
        map[key].push(tasks[i]);
      }
      return map;
    },
    [tasks]
  );

  var selectedDayTasks =
    tasksByDueDate[selectedDay] || [];

  // Stats
  var allTotal = tasks.length;
  var allDone = tasks.filter(function (t) {
    return t.column === "Done";
  }).length;

  // Style helpers
  var pillBtn = function (active) {
    return {
      border: "none",
      borderRadius: 999,
      padding: "10px 14px",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 13,
      color: THEME.text,
      background: active
        ? "rgba(255,255,255,0.92)"
        : THEME.pill,
      boxShadow: active
        ? "0 10px 24px rgba(0,0,0,0.06)"
        : "none",
    };
  };

  var softBtn = function (bg) {
    return {
      border: "none",
      borderRadius: 14,
      padding: "10px 14px",
      cursor: "pointer",
      fontWeight: 900,
      color: "#fff",
      background: bg,
      boxShadow: "0 14px 28px rgba(0,0,0,0.10)",
    };
  };

  // RENDER
  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bg,
        color: THEME.text,
        fontFamily:
          "Segoe UI, system-ui, -apple-system, sans-serif",
      }}
    >
      <style>
        {
