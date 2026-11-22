"""Timeline: bar/time ruler, colour-coded section blocks, vocal lane, playhead, loop region."""

from __future__ import annotations

from PySide6.QtCore import QPoint, QPointF, QRectF, Qt, Signal
from PySide6.QtGui import QColor, QFont, QMouseEvent, QPainter, QPen, QWheelEvent
from PySide6.QtWidgets import QScrollArea, QSizePolicy, QWidget

from app.project.model import Project
from app.ui import theme
from app.ui.timeline_math import (
    bar_to_x,
    beat_subdivisions_visible,
    clamp_zoom,
    format_time,
    ruler_step_bars,
    snap_bar,
    x_to_bar,
)

RULER_H = 30
SECTION_LANE_H = 72
VOCAL_LANE_H = 64
LANE_GAP = 6
LEFT_PAD = 12
RIGHT_PAD = 160
EDGE_GRAB_PX = 7


class TimelineCanvas(QWidget):
    """The drawable surface; ``TimelineView`` wraps it in a horizontal scroll area."""

    seek_requested = Signal(float)  # bar
    loop_changed = Signal(object)  # (start_bar, end_bar) or None
    section_selected = Signal(str)  # section id
    section_activated = Signal(str)  # double-click
    section_resized = Signal(str, int)  # id, new bar count (commit on release)
    context_menu_requested = Signal(object, QPoint)  # section id or None, global pos
    zoom_changed = Signal(float)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.project: Project | None = None
        self.ppb = 40.0
        self.playhead_bar = 0.0
        self.loop: tuple[float, float] | None = None
        self.selected_id: str | None = None
        self.rendered: set[str] = set()  # section ids with a ready preview
        self.vocal_placements: list[tuple[float, float, str]] = []  # (bar, bars, label) — phase 3
        self._drag_mode: str | None = None
        self._drag_section: str | None = None
        self._drag_start_bar = 0.0
        self._drag_bars = 0
        self.setMouseTracking(True)
        self.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Expanding)
        self.setMinimumHeight(RULER_H + SECTION_LANE_H + VOCAL_LANE_H + 3 * LANE_GAP)

    # ---- state --------------------------------------------------------------------
    def set_project(self, project: Project) -> None:
        self.project = project
        self._update_size()
        self.update()

    def set_zoom(self, ppb: float) -> None:
        ppb = clamp_zoom(ppb)
        if ppb != self.ppb:
            self.ppb = ppb
            self._update_size()
            self.zoom_changed.emit(ppb)
            self.update()

    def set_playhead(self, bar: float) -> None:
        if abs(bar - self.playhead_bar) > 1e-4:
            self.playhead_bar = bar
            self.update()

    def set_loop(self, loop: tuple[float, float] | None) -> None:
        self.loop = loop
        self.update()

    def set_selected(self, section_id: str | None) -> None:
        self.selected_id = section_id
        self.update()

    def set_rendered(self, ids: set[str]) -> None:
        self.rendered = ids
        self.update()

    def total_bars(self) -> int:
        return self.project.total_bars if self.project else 0

    def _update_size(self) -> None:
        w = int(bar_to_x(max(self.total_bars(), 8), self.ppb, LEFT_PAD) + RIGHT_PAD)
        self.setFixedWidth(w)

    # ---- geometry ---------------------------------------------------------------------
    def _x(self, bar: float) -> float:
        return bar_to_x(bar, self.ppb, LEFT_PAD)

    def _bar(self, x: float) -> float:
        return x_to_bar(x, self.ppb, LEFT_PAD)

    def _section_lane_rect(self) -> QRectF:
        return QRectF(0, RULER_H + LANE_GAP, self.width(), SECTION_LANE_H)

    def _vocal_lane_rect(self) -> QRectF:
        top = RULER_H + LANE_GAP + SECTION_LANE_H + LANE_GAP
        return QRectF(0, top, self.width(), VOCAL_LANE_H)

    def _section_rects(self) -> list[tuple[str, QRectF]]:
        out: list[tuple[str, QRectF]] = []
        if not self.project:
            return out
        lane = self._section_lane_rect()
        pos = 0
        for s in self.project.sections:
            x0, x1 = self._x(pos), self._x(pos + s.bars)
            out.append((s.id, QRectF(x0 + 1, lane.top() + 4, max(2.0, x1 - x0 - 2), lane.height() - 8)))
            pos += s.bars
        return out

    def _hit_section(self, p: QPointF) -> tuple[str | None, bool]:
        """Return (section id under point, near-right-edge)."""
        for sid, r in self._section_rects():
            if r.contains(p):
                return sid, (r.right() - p.x()) <= EDGE_GRAB_PX
        return None, False

    # ---- painting -----------------------------------------------------------------
    def paintEvent(self, event) -> None:  # noqa: N802, ANN001
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing, False)
        p.fillRect(self.rect(), QColor(theme.BG))
        if not self.project:
            p.end()
            return
        total = self.total_bars()
        self._paint_grid(p, total)
        self._paint_sections(p)
        self._paint_vocal_lane(p)
        self._paint_loop(p)
        self._paint_ruler(p, total)
        self._paint_playhead(p)
        p.end()

    def _paint_grid(self, p: QPainter, total: int) -> None:
        step = ruler_step_bars(self.ppb)
        beats = beat_subdivisions_visible(self.ppb)
        top, bottom = RULER_H, self.height()
        for bar in range(0, total + 1):
            if bar % step == 0:
                p.setPen(QPen(QColor(theme.GRID_STRONG), 1))
                x = int(self._x(bar))
                p.drawLine(x, top, x, bottom)
            if beats and bar < total:
                p.setPen(QPen(QColor(theme.GRID), 1))
                for b in range(1, 4):
                    x = int(self._x(bar + b / 4))
                    p.drawLine(x, top, x, bottom)

    def _paint_ruler(self, p: QPainter, total: int) -> None:
        p.fillRect(QRectF(0, 0, self.width(), RULER_H), QColor(theme.PANEL))
        p.setPen(QPen(QColor(theme.BORDER), 1))
        p.drawLine(0, RULER_H - 1, self.width(), RULER_H - 1)
        step = ruler_step_bars(self.ppb)
        font = QFont(self.font())
        font.setPointSize(9)
        p.setFont(font)
        bar_sec = self.project.bar_seconds if self.project else 1.0
        for bar in range(0, total + 1, step):
            x = int(self._x(bar))
            p.setPen(QPen(QColor(theme.TEXT_DIM), 1))
            p.drawLine(x, RULER_H - 10, x, RULER_H - 1)
            p.setPen(QColor(theme.TEXT))
            p.drawText(x + 4, 12, str(bar + 1))
            p.setPen(QColor(theme.TEXT_DIM))
            p.drawText(x + 4, 25, format_time(bar * bar_sec))
        if self.loop:
            x0, x1 = self._x(self.loop[0]), self._x(self.loop[1])
            p.fillRect(QRectF(x0, 0, x1 - x0, 5), QColor(theme.LOOP))

    def _paint_sections(self, p: QPainter) -> None:
        lane = self._section_lane_rect()
        p.fillRect(lane, QColor(theme.PANEL).darker(105))
        font = QFont(self.font())
        font.setBold(True)
        small = QFont(self.font())
        small.setPointSize(8)
        for (sid, r), sec in zip(self._section_rects(), self.project.sections, strict=True):
            color = QColor(theme.SECTION_COLORS[sec.kind])
            fill = QColor(color)
            fill.setAlpha(170 if sid in self.rendered else 95)
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(fill)
            p.drawRoundedRect(r, 5, 5)
            if sid == self.selected_id:
                p.setPen(QPen(QColor(theme.TEXT), 2))
                p.setBrush(Qt.BrushStyle.NoBrush)
                p.drawRoundedRect(r.adjusted(1, 1, -1, -1), 5, 5)
            p.setPen(QPen(color.lighter(150), 1))
            p.drawLine(QPointF(r.left(), r.top() + 1), QPointF(r.right(), r.top() + 1))
            if r.width() > 40:
                p.setPen(QColor("white"))
                p.setFont(font)
                p.drawText(r.adjusted(8, 6, -6, 0), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignTop, sec.name)
                p.setFont(small)
                p.setPen(QColor(230, 230, 240, 200))
                info = f"{sec.kind.value} · {sec.bars} bars"
                if sid not in self.rendered:
                    info += " · not rendered"
                p.drawText(r.adjusted(8, 0, -6, -6), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignBottom, info)

    def _paint_vocal_lane(self, p: QPainter) -> None:
        lane = self._vocal_lane_rect()
        p.fillRect(lane, QColor(theme.PANEL).darker(110))
        p.setPen(QColor(theme.TEXT_DIM))
        small = QFont(self.font())
        small.setPointSize(9)
        p.setFont(small)
        if not self.vocal_placements:
            p.drawText(
                lane.adjusted(LEFT_PAD, 0, 0, 0),
                Qt.AlignmentFlag.AlignVCenter,
                "Vocal lane — import a vocal to place regions here",
            )
        for bar, bars, label in self.vocal_placements:
            r = QRectF(self._x(bar) + 1, lane.top() + 6, max(2.0, bars * self.ppb - 2), lane.height() - 12)
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QColor(theme.ACCENT_DIM))
            p.drawRoundedRect(r, 5, 5)
            p.setPen(QColor("white"))
            p.drawText(r.adjusted(6, 0, -4, 0), Qt.AlignmentFlag.AlignVCenter, label)

    def _paint_loop(self, p: QPainter) -> None:
        if not self.loop:
            return
        x0, x1 = self._x(self.loop[0]), self._x(self.loop[1])
        c = QColor(theme.LOOP)
        c.setAlpha(28)
        p.fillRect(QRectF(x0, RULER_H, x1 - x0, self.height() - RULER_H), c)
        p.setPen(QPen(QColor(theme.LOOP), 1, Qt.PenStyle.DashLine))
        p.drawLine(int(x0), RULER_H, int(x0), self.height())
        p.drawLine(int(x1), RULER_H, int(x1), self.height())

    def _paint_playhead(self, p: QPainter) -> None:
        x = int(self._x(self.playhead_bar))
        p.setPen(QPen(QColor(theme.PLAYHEAD), 2))
        p.drawLine(x, 0, x, self.height())
        p.setBrush(QColor(theme.PLAYHEAD))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawPolygon([QPoint(x - 6, 0), QPoint(x + 6, 0), QPoint(x, 8)])

    # ---- interaction --------------------------------------------------------------------
    def mousePressEvent(self, e: QMouseEvent) -> None:  # noqa: N802
        if not self.project:
            return
        pos = e.position()
        if e.button() == Qt.MouseButton.RightButton:
            sid, _ = self._hit_section(pos)
            self.context_menu_requested.emit(sid, e.globalPosition().toPoint())
            return
        if e.button() != Qt.MouseButton.LeftButton:
            return
        if pos.y() < RULER_H:
            bar = snap_bar(self._bar(pos.x()), 4)
            self._drag_mode = "ruler"
            self._drag_start_bar = snap_bar(self._bar(pos.x()), 1)
            self.seek_requested.emit(min(bar, float(self.total_bars())))
            return
        sid, edge = self._hit_section(pos)
        if sid:
            self.selected_id = sid
            self.section_selected.emit(sid)
            if edge:
                sec = self.project.get_section(sid)
                self._drag_mode = "resize"
                self._drag_section = sid
                self._drag_start_bar = self.project.section_start_bar(sid)
                self._drag_bars = sec.bars
                self.setCursor(Qt.CursorShape.SizeHorCursor)
            self.update()

    def mouseMoveEvent(self, e: QMouseEvent) -> None:  # noqa: N802
        pos = e.position()
        if self._drag_mode == "ruler":
            end = snap_bar(self._bar(pos.x()), 1)
            start = self._drag_start_bar
            if end != start:
                lo, hi = sorted((start, end))
                hi = min(hi, float(self.total_bars()))
                if hi > lo:
                    self.loop = (lo, hi)
                    self.update()
            return
        if self._drag_mode == "resize" and self._drag_section:
            bars = max(1, int(round(self._bar(pos.x()) - self._drag_start_bar)))
            if bars != self._drag_bars:
                self._drag_bars = bars
                self.update()
            return
        if pos.y() >= RULER_H:
            _, edge = self._hit_section(pos)
            self.setCursor(Qt.CursorShape.SizeHorCursor if edge else Qt.CursorShape.ArrowCursor)

    def mouseReleaseEvent(self, e: QMouseEvent) -> None:  # noqa: N802
        if self._drag_mode == "ruler":
            self.loop_changed.emit(self.loop)
        elif self._drag_mode == "resize" and self._drag_section:
            sec = self.project.get_section(self._drag_section) if self.project else None
            if sec and self._drag_bars != sec.bars:
                self.section_resized.emit(self._drag_section, self._drag_bars)
        self._drag_mode = None
        self._drag_section = None
        self.setCursor(Qt.CursorShape.ArrowCursor)

    def mouseDoubleClickEvent(self, e: QMouseEvent) -> None:  # noqa: N802
        sid, _ = self._hit_section(e.position())
        if sid:
            self.section_activated.emit(sid)
        elif e.position().y() < RULER_H:
            self.loop = None
            self.loop_changed.emit(None)
            self.update()

    def wheelEvent(self, e: QWheelEvent) -> None:  # noqa: N802
        if e.modifiers() & Qt.KeyboardModifier.ControlModifier:
            factor = 1.15 if e.angleDelta().y() > 0 else 1 / 1.15
            self.set_zoom(self.ppb * factor)
            e.accept()
        else:
            e.ignore()


class TimelineView(QScrollArea):
    """Horizontal scroll area hosting the canvas; forwards the canvas signals."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.canvas = TimelineCanvas()
        self.setWidget(self.canvas)
        self.setWidgetResizable(False)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOn)
        self.setFrameShape(QScrollArea.Shape.NoFrame)
        self.setMinimumHeight(self.canvas.minimumHeight() + 14)

    def resizeEvent(self, e) -> None:  # noqa: N802, ANN001
        super().resizeEvent(e)
        self.canvas.setFixedHeight(self.viewport().height())

    def wheelEvent(self, e: QWheelEvent) -> None:  # noqa: N802
        if e.modifiers() & Qt.KeyboardModifier.ControlModifier:
            self.canvas.wheelEvent(e)
            return
        bar = self.horizontalScrollBar()
        bar.setValue(bar.value() - e.angleDelta().y())

    def zoom_to_fit(self) -> None:
        total = max(self.canvas.total_bars(), 1)
        self.canvas.set_zoom((self.viewport().width() - LEFT_PAD - RIGHT_PAD) / total)

    def follow_playhead(self) -> None:
        """Scroll so the playhead stays visible while playing."""
        x = int(self.canvas._x(self.canvas.playhead_bar))
        sb = self.horizontalScrollBar()
        view_w = self.viewport().width()
        if x < sb.value() + 20 or x > sb.value() + view_w - 40:
            sb.setValue(max(0, x - view_w // 4))
